FROM ubuntu:14.04

RUN apt-get -y update && apt-get -y upgrade
RUN apt-get -y install dpkg-dev

RUN mkdir /local-apt
RUN sed -i '1s$^$deb file:///local-apt /\n$' /etc/apt/sources.list

COPY --from=eaas/deb:slirpvde /out /local-apt

RUN cd /local-apt && dpkg-scanpackages . | gzip -c > Packages.gz
RUN apt-get -y update
