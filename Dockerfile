FROM phusion/baseimage

CMD ["/sbin/my_init"]

RUN apt-get -y update && apt-get install \
  pdns-backend-sqlite3 \
  pdns-server \
  -y

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN echo "webserver=yes" >> /etc/powerdns/pdns.d/pdns.local.conf
RUN echo "webserver-address=0.0.0.0" >> /etc/powerdns/pdns.d/pdns.local.conf

RUN echo "api=yes" >> /etc/powerdns/pdns.d/pdns.local.conf
RUN echo "api-key=changeme" >> /etc/powerdns/pdns.d/pdns.local.conf

COPY files /

RUN pdnsutil create-zone . || true
RUN echo "gsqlite3-database=/tmp/powerdns/pdns.sqlite3" >> /etc/powerdns/pdns.d/pdns.local.gsqlite3.conf

EXPOSE 53/udp 53/tcp
EXPOSE 8081

#
# curl -v -X PATCH -H 'X-API-Key: changeme' http://127.0.0.1:8081/api/v1/servers/localhost/zones/=2E -d '{"rrsets": [{"changetype": "REPLACE", "name": "abc.def.", "type": "A", "ttl": 10, "records": [{"content": "127.0.0.11", "disabled": false}] }]}'
