START: ALL
	mkdir -p mnt
	./hello -f mnt

ALL: hello

%: %.c
	gcc -Wall $< `pkg-config fuse --cflags --libs` -o $@
