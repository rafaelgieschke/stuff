#!/bin/sh

export PDNS_Url="http://localhost:8090"
export PDNS_ServerId="localhost"
export PDNS_Token="$(awk -F= -- '$1 == "api-key" { print $2 }' /data/pdns.local.conf)"
export PDNS_Ttl=60
export Le_DNSSleep=5
export DEPLOY_NGHTTPX_RELOAD="sv reload nghttpx"

export LE_CONFIG_HOME="/data/acme.sh"
exec /root/.acme.sh/acme.sh "$@"
