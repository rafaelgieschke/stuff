#!/bin/sh
set -xeu

cur="$PWD"
src="$(mktemp -d)"
dst="$cur"

git clone --depth 1 -b fuse_2_9_bugfix https://github.com/libfuse/libfuse/ "$src"
cd -- "$src/example"
gcc -Wall hello.c $(pkg-config fuse --cflags --libs --static) -o hello -static
cp hello "$dst/fuse-hello"
cd -- "$cur"
