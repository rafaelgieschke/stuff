#define _GNU_SOURCE
#include <fcntl.h>
#include <linux/netlink.h>
#include <linux/rtnetlink.h>
#include <linux/sock_diag.h>
#include <linux/unix_diag.h>
#include <sched.h>
#include <stdio.h>
#include <sys/socket.h>
#include <sys/stat.h>
#include <unistd.h>

int main(int argc, char **argv) {
  if (argc >= 3 && setns(open(argv[2], O_RDONLY), CLONE_NEWNET)) return 1;

  int fd = socket(AF_NETLINK, SOCK_RAW, NETLINK_SOCK_DIAG);
  if (fd < 0) return 1;

  struct {
    struct nlmsghdr a;
    struct unix_diag_req b;
  } req = {{sizeof(req), SOCK_DIAG_BY_FAMILY, NLM_F_REQUEST | NLM_F_DUMP},
           {AF_UNIX, .udiag_states = -1, .udiag_show = UDIAG_SHOW_VFS}};
  if (sendmsg(fd,
              &(struct msghdr){(void *)&(struct sockaddr_nl){AF_NETLINK},
                               sizeof(struct sockaddr_nl),
                               &(struct iovec){&req, sizeof(req)}, 1},
              0) < 0)
    return 1;

  struct stat statbuf;
  if (stat(argv[1], &statbuf)) return 1;

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
      struct unix_diag_vfs vfs =
          *(struct unix_diag_vfs *)RTA_DATA((struct rtattr *)(diag + 1));
      if (vfs.udiag_vfs_dev == statbuf.st_dev &&
          vfs.udiag_vfs_ino == statbuf.st_ino) {
        return diag->udiag_state != 10;
      }
    }
  }
  return 1;
}
