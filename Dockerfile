FROM phusion/baseimage
# FROM eaas/eaas-dev

CMD ["/sbin/my_init"]

RUN apt-get -y update && apt-get install \
  nginx \
  pdns-backend-sqlite3 \
  pdns-server \
  -y

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY files /

RUN pdnsutil create-zone . || true
RUN echo "gsqlite3-database=/data/pdns.sqlite3" >> /etc/powerdns/pdns.d/pdns.local.gsqlite3.conf

VOLUME ["/data"]
RUN ln -s /data/pdns.local.conf /etc/powerdns/pdns.d/z-pdns.local.conf

EXPOSE 53/udp 53/tcp
EXPOSE 8081
