FROM ubuntu

COPY init /
COPY test /
CMD ["/init"]
