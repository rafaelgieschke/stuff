// SPDX-License-Identifier: CC0-1.0

#include <fcntl.h>
#include <linux/random.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/ioctl.h>

int main(int argc, char **argv) {
  int ent = atoi(argv[1]);
  ioctl(open("/dev/random", O_RDONLY), RNDADDTOENTCNT, &ent);
  perror("ioctl");
}
