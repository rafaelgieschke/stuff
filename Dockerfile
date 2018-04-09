FROM neilpang/nginx-proxy
RUN /acme.sh/acme.sh --upgrade
