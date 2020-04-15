#define _GNU_SOURCE
#include <fcntl.h>
#include <linux/netlink.h>
#include <linux/rtnetlink.h>
#include <linux/sock_diag.h>
#include <linux/unix_diag.h>
#include <sched.h>
#include <stdio.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <sys/sysmacros.h>
#include <sys/un.h>
#include <unistd.h>

// From linux/include/linux/kdev_t.h:
#define MINORBITS 20
#define MINORMASK ((1U << MINORBITS) - 1)

int get_next_sock_ino() {
  struct stat statbuf;
  int sock_fd = socket(AF_UNIX, SOCK_STREAM, 0);
  fstat(sock_fd, &statbuf);
  close(sock_fd);
  return statbuf.st_ino;
}

int main(int argc, char **argv) {
  if (argc >= 3 && setns(open(argv[2], O_RDONLY), CLONE_NEWNET)) return 1;

  char *path = argv[1];
  size_t path_len = strlen(path) + 1;

  int sock_fd = socket(AF_UNIX, SOCK_STREAM, 0);
  struct sockaddr_un addr = {AF_UNIX, ""};
  if (path_len > sizeof addr.sun_path) return 1;
  memcpy(addr.sun_path, path, path_len);

  bind(sock_fd, (struct sockaddr *)&addr, sizeof addr);
  struct stat statbuf, fstatbuf;
  stat(argv[1], &statbuf);
  fstat(sock_fd, &fstatbuf);
  unlink(path);

  int fd = socket(AF_NETLINK, SOCK_RAW, NETLINK_SOCK_DIAG);
  if (fd < 0) return 1;

  struct {
    struct nlmsghdr a;
    struct unix_diag_req b;
  } req = {{sizeof(req), SOCK_DIAG_BY_FAMILY, NLM_F_REQUEST | NLM_F_DUMP},
           {AF_UNIX, .udiag_states = -1,
            .udiag_show = UDIAG_SHOW_NAME | UDIAG_SHOW_VFS}};
  if (sendmsg(fd,
              &(struct msghdr){(void *)&(struct sockaddr_nl){AF_NETLINK},
                               sizeof(struct sockaddr_nl),
                               &(struct iovec){&req, sizeof(req)}, 1},
              0) < 0)
    return 1;

  for (;;) {
    long buf[8192 / sizeof(long)];
    ssize_t ret =
        recvmsg(fd,
                &(struct msghdr){(void *)&(struct sockaddr_nl){AF_NETLINK},
                                 sizeof(struct sockaddr_nl),
                                 &(struct iovec){&buf, sizeof(buf)}, 1},
                0);
    if (ret <= 0) return 1;

    for (const struct nlmsghdr *h = (struct nlmsghdr *)buf; NLMSG_OK(h, ret);
         h = NLMSG_NEXT(h, ret)) {
      if (h->nlmsg_type == NLMSG_DONE) return 1;
      if (h->nlmsg_type != SOCK_DIAG_BY_FAMILY) continue;
      const struct unix_diag_msg *diag = NLMSG_DATA(h);
      struct rtattr *attr = (struct rtattr *)(diag + 1);
      unsigned int rta_len = h->nlmsg_len - NLMSG_LENGTH(sizeof(*diag));
      struct unix_diag_vfs vfs = {0};
      int found = 0;
      for (; RTA_OK(attr, rta_len); attr = RTA_NEXT(attr, rta_len)) {
        switch (attr->rta_type) {
          case UNIX_DIAG_NAME:
            if (RTA_PAYLOAD(attr) != path_len) break;
            if (!memcmp(path, RTA_DATA(attr), RTA_PAYLOAD(attr))) found = 1;
            break;
          case UNIX_DIAG_VFS:
            vfs = *(struct unix_diag_vfs *)RTA_DATA(attr);
            break;
        }
      }
      if (found) {
        printf("fstat (on sockfd): maj:%u, min:%u, ino:%lu\n",
               major(fstatbuf.st_dev), minor(fstatbuf.st_dev), fstatbuf.st_ino);
        printf("(next sockfd ino: %u)\n", get_next_sock_ino());
        printf("stat: maj:%u, min:%u, ino:%lu\n", major(statbuf.st_dev),
               minor(statbuf.st_dev), statbuf.st_ino);
        printf("sock_diag: maj:%u, min:%u, ino:%u\n",
               vfs.udiag_vfs_dev >> MINORBITS, vfs.udiag_vfs_dev & MINORMASK,
               vfs.udiag_vfs_ino);
        if (statbuf.st_ino != vfs.udiag_vfs_ino) {
          printf("Inode number mismatch\n");
          return 1;
        }
        if (major(statbuf.st_dev) != (vfs.udiag_vfs_dev >> MINORBITS)) {
          printf("Major number mismatch\n");
          return 1;
        }
        if (minor(statbuf.st_dev) != (vfs.udiag_vfs_dev & MINORMASK)) {
          printf("Minor number mismatch\n");
          return 1;
        }
        printf("OK\n");
        return 0;
      }
    }
  }
  return 1;
}
