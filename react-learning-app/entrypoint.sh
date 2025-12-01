#!/bin/sh

# In log file của nginx ra console (để xem log trên Docker)
ln -sf /dev/stdout /var/log/nginx/access.log
ln -sf /dev/stderr /var/log/nginx/error.log

exec "$@"
