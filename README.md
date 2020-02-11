# Running `mount` inside an unprivileged Docker container

[mount(2)](http://man7.org/linux/man-pages/man2/mount.2.html)
needs `CAP_SYS_ADMIN`.

Thus,

```console
docker run fedora \
  sh -c 'mount -t tmpfs / /var; ls -la /var'

mount: /var: permission denied.
```

cannot work.

It should be possible to run `mount` in a user and mount namespace inside
the docker container:

```console
docker run fedora \
  unshare -r -m sh -c 'mount -t tmpfs / /var; ls -la /var'

unshare: unshare failed: Operation not permitted
```

This is forbidden by the Docker's
[`seccomp` profile](https://github.com/moby/moby/blob/master/profiles/seccomp/default.json) (`default.original.json`).

`unshare(2)` and `mount(2)` can be added to Docker's `seccomp` profile
(`unshare(1)` already needs `mount(2)` unless it is run as `unshare -r -m --propagation unchanged`)):

```console
docker run --security-opt seccomp=allow-unshare.json fedora \
  unshare -r -m sh -c 'mount -t tmpfs / /var; ls -la /var'

unshare: cannot change root filesystem propagation: Operation not permitted
```

Now, Docker's [AppArmor](https://docs.docker.com/engine/security/apparmor/)
is still forbidding the `mount(2)` system call. It can simply be disabled:

```console
docker run --security-opt apparmor=unconfined \
  --security-opt seccomp=allow-unshare.json fedora \
  unshare -r -m sh -c 'mount -t tmpfs / /var; ls -la /var'

total 4
drwxrwxrwt 2 root root   40 Feb 11 14:34 .
drwxr-xr-x 1 root root 4096 Feb 11 14:34 ..
```

**Note:** It would be better, though, to modify the original template to not forbid
`mount(2)`: <https://github.com/moby/moby/blob/master/profiles/apparmor/template.go>.

This procedure also works if Docker is run with a non-root user inside the container:

```console
docker run --user 2000 --security-opt apparmor=unconfined \
  --security-opt seccomp=allow-unshare.json fedora \
  unshare -r -m sh -c 'mount -t tmpfs / /var; ls -la /var'

total 4
drwxrwxrwt 2 root root   40 Feb 11 14:34 .
drwxr-xr-x 1 root root 4096 Feb 11 14:34 ..
```

## See also

- https://docs.docker.com/engine/security/rootless/
- https://unit42.paloaltonetworks.com/breaking-docker-via-runc-explaining-cve-2019-5736/
