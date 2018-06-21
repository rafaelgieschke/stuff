# stdsock

`stdsock` allows to convert an executable's stdin/stdout into a datagram-oriented UNIX domain socket. It, thus, allows to seamlessly attach to and detach from a process without a persistent connection. It preserves boundaries between different calls to `read`/`write`.

## Usage

```console
./stdsock in out sh -c 'while :; do date; sleep 2; done'
# Executes `sh -c ...`, redirects its stdout to the
# UNIX domain socket path "out", listens on "in",
# and forwards any messages to the stdin of `sh -c ...`.

./stdsock out in
# Listens on "out", forwards any messages to stdout,
# and forwards any bytes read from stdin to "in".
```
