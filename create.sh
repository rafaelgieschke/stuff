#!/bin/sh
set -xeu

# Alternative (create out.cpio inside Dockerfile):
# docker cp "$(docker create "$(docker build -q .)")":/out.cpio .
#
# In Dockerfile:
# copy --from=busybox /bin/busybox /
# run /busybox find / -xdev "!" -path /out.cpio | /busybox cpio -o -H newc > /out.cpio

FROMDIR="${1:-.}"
FROM="$(docker build -q "$FROMDIR")"

BUSYBOXPATH="/tmp/busybox"

docker run --rm "$(printf 'from %s\ncopy --from=busybox /bin/busybox %s' "$FROM" "$BUSYBOXPATH" | docker build -q -)" "$BUSYBOXPATH" sh -c '"$0" find / -xdev ! -path "$0" | "$0" cpio -o -H newc' "$BUSYBOXPATH" > out.cpio

# | gzip -c > out.cpio
