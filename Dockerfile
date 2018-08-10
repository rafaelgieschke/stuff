FROM ubuntu:14.04

RUN mkdir /work; mkdir /out
WORKDIR /work

RUN apt-get -y update && apt-get -y upgrade && apt-get -y install apt-src

RUN apt-src update && apt-src install vde2
RUN sed -Ei 's/(TCP_(RCV|SND)SPACE) 8192/\1 100000/' vde2*/src/slirpvde/tcp.h
RUN apt-src build vde2

RUN mv *.deb /out
