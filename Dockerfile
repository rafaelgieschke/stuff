FROM eaas/eaas-dev
RUN apt-get -y update && apt-get -y install nginx
COPY files /

# RUN echo ""
