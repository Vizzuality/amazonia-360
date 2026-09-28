FROM postgres:18.0-alpine3.22

COPY database/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh
COPY database/initdb/ /docker-entrypoint-initdb.d/

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["postgres"]
