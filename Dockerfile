FROM node:7-alpine

WORKDIR /app
ADD . .

RUN apk add --update git
RUN npm install
RUN npm install
RUN node node_modules/gulp/bin/gulp.js

ENV OS_PACKAGER_BASE_PATH=packager

ADD docker/settings.json /app/settings.json

EXPOSE 8000

CMD OS_CONDUCTOR="//${OS_EXTERNAL_ADDRESS}" /app/docker/startup.sh
