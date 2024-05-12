FROM node:18-slim

WORKDIR /app

COPY package.json .
COPY package-lock.json . 

RUN npm install
COPY index.js .

ARG HTTP_PORT
ARG AWS_ENDPOINT 

ENV HTTP_PORT=$HTTP_PORT
ENV AWS_ENDPOINT=$AWS_ENDPOINT

EXPOSE 8080
CMD ["npm", "start"]
