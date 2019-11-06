#include <arpa/inet.h>
#include <netinet/ip.h>
#include <stdio.h>
#include <sys/socket.h>

#include <linux/netfilter_ipv4.h>

int main(void) {
  int sock = socket(AF_INET, SOCK_STREAM, 0);
  {
    struct sockaddr_in addr = {AF_INET, htons(8080), inet_addr("0.0.0.0")};
    bind(sock, (struct sockaddr *)&addr, sizeof addr);
  }
  listen(sock, 256);
  struct sockaddr_in peer;
  socklen_t peer_size = sizeof peer;
  int fd = accept(sock, (struct sockaddr *)&peer, &peer_size);
  {
    struct sockaddr_in addr;
    socklen_t addr_size = sizeof addr;
    getsockopt(fd, SOL_IP, SO_ORIGINAL_DST, &addr, &addr_size);
    char ip[1024];
    inet_ntop(AF_INET, &addr.sin_addr, ip, sizeof ip);
    printf("%s:%i\n", ip, ntohs(addr.sin_port));
  }
}
