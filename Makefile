%: %.c
	gcc -Wall $< `pkg-config fuse --cflags --libs` -o $@
