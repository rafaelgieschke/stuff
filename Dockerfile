FROM ubuntu
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    runit \
    cron \
    &&:

COPY init /init
CMD ["/init"]

COPY cron-service /etc/service/cron/run

# Example services
COPY example-runonce /etc/my_init.d/00_example
COPY example-service /etc/service/example/run
