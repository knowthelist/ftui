FROM nginx:stable-alpine

LABEL maintainer="Mario Stephan <mstephan@shared-files.de>"

COPY www/ftui /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost/ || exit 1