#!/bin/sh
set -xeu

qemu-system-x86_64 -kernel vmlinuz -initrd out.cpio -m 512M "$@"
