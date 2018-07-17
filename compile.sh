#!/bin/sh
gcc -c a.c
ld -o a.out a.o
ld -r -o a.out.r a.o
ld -pie -o a.out.pie a.o
objdump -rd a.out
objdump -rd a.out.r
objdump -rd a.out.pie
