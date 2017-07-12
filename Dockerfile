FROM node:7-alpine

WORKDIR /app
ADD . .

RUN npm install && npm build

ENV OS_PACKAGER_BASE_PATH=packager

ADD docker/settings.json /app/settings.json

EXPOSE 8000

CMD OS_CONDUCTOR="//${OS_EXTERNAL_ADDRESS}" /app/docker/startup.sh
