#!/bin/sh
set -x

# Use if packets come from outside:
# sudo iptables -t nat -A PREROUTING -j REDIRECT -p tcp --to-port 8080

# Local test:
sudo iptables -t nat -A OUTPUT -j REDIRECT -p tcp --to-port 8080

cat << EOF
# End with:
sudo iptables -t nat -F OUTPUT
EOF
