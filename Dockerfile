from ubuntu
run apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --force-yes \
    runit \
    cron \
    &&:

copy init /init
cmd ["/init"]

copy cron-service /etc/service/cron/run

# Example services
copy example-runonce /etc/my_init.d/00_example
copy example-service /etc/service/example/run
