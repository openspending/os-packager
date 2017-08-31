FROM node:7-alpine

WORKDIR /app
ADD . .

RUN apk add --update --no-cache git
RUN npm install && npm run build

ENV OS_PACKAGER_BASE_PATH=packager

ADD docker/settings.json /app/settings.json

EXPOSE 8000

ENTRYPOINT ["npm", "start"]
