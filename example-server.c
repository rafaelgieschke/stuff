#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

int main(void) {
  for (;;) {
    unlink("sock");
    bind(socket(AF_UNIX, SOCK_STREAM, 0),
         (struct sockaddr*)&(struct sockaddr_un){AF_UNIX, "sock"},
         sizeof(struct sockaddr_un));
    sleep(1);
    listen(3, 0);
    sleep(1);
    close(3);
  }
  pause();
}
