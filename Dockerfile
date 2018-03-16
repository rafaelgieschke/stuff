FROM phusion/baseimage
# FROM eaas/eaas-dev

CMD ["/sbin/my_init"]

RUN apt-get -y update && apt-get install \
  git \
  nghttp2-proxy \
  pdns-backend-sqlite3 \
  pdns-server \
  ssl-cert \
  -y

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY files /

RUN pdnsutil create-zone . || true
RUN echo "gsqlite3-database=/data/pdns/pdns.sqlite3" >> /etc/powerdns/pdns.d/pdns.local.gsqlite3.conf

VOLUME ["/data"]
RUN ln -s /data/pdns.local.conf /etc/powerdns/pdns.d/z-pdns.local.conf

RUN \
  mkdir -p /data/acme.sh && \
  cd /tmp && \
  # git clone https://github.com/Neilpang/acme.sh && \
  git clone https://github.com/rafaelgieschke/acme.sh && \
  cd acme.sh && \
  ./acme.sh --install --config-home /data/acme.sh && \
  true 5

EXPOSE 53/udp 53/tcp
EXPOSE 8081
