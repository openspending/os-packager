FROM node:8-alpine

RUN apk add --update --no-cache git

WORKDIR /app
ADD package.json .
RUN npm install

ADD . .
RUN npm run build

ADD docker/settings.json /app/settings.json

EXPOSE 8000

CMD npm start
