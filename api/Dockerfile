FROM python:3.11-slim
LABEL maintainer="hello@vizzuality.com"

ENV NAME api
ENV APP_HOME /opt/$NAME
ENV DATA_HOME ${APP_HOME}/data

WORKDIR $APP_HOME

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
