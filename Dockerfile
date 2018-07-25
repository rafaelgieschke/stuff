FROM debian:sid
RUN apt-get -y update && apt-get -y upgrade && apt-get -y install debos
