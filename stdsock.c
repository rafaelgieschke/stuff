// Copyright 2018 The bwFLA Authors.
// Released under GPL v3.0.

#include <fcntl.h>
#include <poll.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/socket.h>
#include <sys/types.h>
#include <sys/un.h>
#include <unistd.h>

char *in_path;

void terminate() {
  unlink(in_path);
  exit(0);
}

void set_nonblock(int fd) {
  fcntl(fd, F_SETFL, fcntl(fd, F_GETFL) | O_NONBLOCK);
}

int main(int argc, char **argv) {
  if (argc < 3)
    return 1;
  in_path = argv[1];
  char *out_path = argv[2];
  int do_fork = argc > 3;
  argv += 3;

  signal(SIGTERM, terminate);
  signal(SIGINT, terminate);

  int sv[2];
  if (do_fork) {
    socketpair(AF_UNIX, SOCK_DGRAM, 0, sv);
    fcntl(sv[0], F_SETFD, FD_CLOEXEC);
    set_nonblock(sv[0]);
  }

  int sock = socket(AF_UNIX, SOCK_DGRAM, 0);
  fcntl(sock, F_SETFD, FD_CLOEXEC);
  set_nonblock(sock);

  struct sockaddr_un out_addr = {AF_UNIX};
  strncpy(out_addr.sun_path, out_path, sizeof out_addr.sun_path - 1);

  struct pollfd pollv[] = {{sock, POLLIN}, {do_fork ? sv[0] : 0, POLLIN}};

  struct sockaddr_un in_addr = {AF_UNIX};
  strncpy(in_addr.sun_path, in_path, sizeof in_addr.sun_path - 1);
  if (bind(sock, (struct sockaddr *)&in_addr, sizeof in_addr)) {
    perror("bind");
    return 1;
  }

  if (do_fork) {
    signal(SIGCHLD, terminate);
    if (!fork()) {
      dup2(sv[1], 0);
      dup2(sv[1], 1);
      close(sv[1]);
      execvp(*argv, argv);
      perror("execvp");
      return 1;
    }
    close(sv[1]);
  }

  for (;;) {
    size_t nbytes;
    char buf[4096];

    int p = poll(pollv, sizeof pollv / sizeof *pollv, -1);

    if (pollv[0].revents & POLLIN) {
      nbytes = read(sock, buf, sizeof buf);
      write(do_fork ? sv[0] : 1, buf, nbytes);
    }

    if (pollv[1].revents & POLLIN) {
      nbytes = read(do_fork ? sv[0] : 0, buf, sizeof buf);
      sendto(sock, buf, nbytes, MSG_NOSIGNAL, (struct sockaddr *)&out_addr,
             sizeof out_addr);
    }
  }
}
