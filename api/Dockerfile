FROM python:3.11-slim as base
LABEL maintainer="hello@vizzuality.com"

# Requirement of fiona and gdal.
RUN set -eux; \
	apt-get update; \
	apt-get install -y --no-install-recommends libexpat1; \
	rm -rf /var/lib/apt/lists/*


FROM base as production
ENV NAME api
ENV APP_HOME /opt/$NAME
ENV DATA_HOME ${APP_HOME}/data

WORKDIR $APP_HOME

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM production as development

RUN pip install --no-cache-dir -r requirements-dev.txt
