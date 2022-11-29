#define _GNU_SOURCE

#include <arpa/inet.h>
#include <errno.h>
#include <netinet/in.h>
#include <netinet/tcp.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

void ss(int port) {
  setenv("argv0", program_invocation_short_name, 1);
  char port_s[16];
  snprintf(port_s, sizeof port_s, "%i", port);
  setenv("port", port_s, 1);
  system("ss -tapoeiO | grep \"$port\"");
}

int getsockopt_int(int fd, int level, int optname) {
  int ret = 0;
  socklen_t len = sizeof ret;
  getsockopt(fd, level, optname, &ret, &len);
  return ret;
}

int setsockopt_int(int fd, int level, int optname, int val) {
  return setsockopt(fd, level, optname, &val, sizeof val);
}

int socketpair_tcp(int fds[2]) {
  char *listening_ip = "127.0.0.1";
  int listen_fd = socket(AF_INET, SOCK_STREAM, 0);
  setsockopt_int(listen_fd, SOL_SOCKET, SO_KEEPALIVE, 1);
  setsockopt_int(listen_fd, SOL_TCP, TCP_KEEPIDLE, 2);
  setsockopt_int(listen_fd, SOL_TCP, TCP_KEEPINTVL, 2);
  setsockopt_int(listen_fd, SOL_TCP, TCP_KEEPCNT, 2);
  fds[1] = socket(AF_INET, SOCK_STREAM, 0);
  if (listening_ip) {
    struct sockaddr_in addr = {
        .sin_family = AF_INET,
        .sin_port = 0,
    };
    inet_pton(addr.sin_family, listening_ip, &addr.sin_addr);
    (void)bind(listen_fd, (struct sockaddr *)&addr, sizeof addr);
  }
  listen(listen_fd, 1);
  struct sockaddr_in addr = {};
  socklen_t len = sizeof addr;
  getsockname(listen_fd, (struct sockaddr *)&addr, &len);
  printf("listening on %s:%i\n", inet_ntoa(addr.sin_addr),
         ntohs(addr.sin_port));
  (void)connect(fds[1], (struct sockaddr *)&addr, len);
  fds[0] = accept(listen_fd, 0, 0);
  close(listen_fd);
  return ntohs(addr.sin_port);
}

void error(int fd) {
  printf("SO_ERROR: %s\n", strerror(getsockopt_int(fd, SOL_SOCKET, SO_ERROR)));
}

int main() {
  signal(SIGPIPE, SIG_IGN);
  int listen_fd, fds[2];
  // socketpair(AF_UNIX, SOCK_STREAM, 0, fds);
  int port = socketpair_tcp(fds);
  setsockopt_int(fds[0], SOL_SOCKET, SO_KEEPALIVE, 1);
  setsockopt_int(fds[0], SOL_TCP, TCP_KEEPIDLE, 2);
  setsockopt_int(fds[0], SOL_TCP, TCP_KEEPINTVL, 2);
  setsockopt_int(fds[0], SOL_TCP, TCP_KEEPCNT, 2);
  ss(port);
  // printf("write(): %li\n", write(fds[1], "+", 1));
  // ss();
  shutdown(fds[1], SHUT_RDWR);
  close(fds[1]);
  ss(port);
  char buf[16];
  // printf("read(fds[0]): %li\n", read(fds[0], buf, sizeof buf));

  error(fds[0]);
  for (;;) {
    sleep(1);
    ss(port);
    error(fds[0]);
  }
  sleep(1);
  ss(port);
  error(fds[0]);
  sleep(1);
  error(fds[0]);
  printf("write(fds[0]): %li\n", write(fds[0], buf, sizeof buf));
  error(fds[0]);
  printf("write(fds[0]): %li\n", write(fds[0], buf, sizeof buf));
  ss(port);
  printf("read(fds[0]): %li\n", read(fds[0], buf, sizeof buf));
  ss(port);
  pause();
}
