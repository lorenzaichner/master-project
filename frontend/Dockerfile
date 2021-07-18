FROM node:15.3.0-alpine3.10

RUN npm i -g http-server
RUN npm i -g aurelia-cli

WORKDIR /usr/src/app
COPY ./frontend/package.json .
RUN npm install --legacy-peer-deps
COPY ./frontend .
COPY ./common ../common

RUN npm run build
