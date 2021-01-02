FROM nginx:alpine

LABEL version="3.0" maintainer="Mario Stephan <mstephan@shared-files.de>"

ADD https://github.com/knowthelist/ftui/tarball/master /tmp/ftui.tar
RUN cd /tmp && tar xvzf /tmp/ftui.tar && \
    mv /tmp/knowthelist-ftui-*/www/ftui /usr/share/nginx/html && \
    sed -i "s/#gzip  on;/charset utf-8;/g" /etc/nginx/nginx.conf