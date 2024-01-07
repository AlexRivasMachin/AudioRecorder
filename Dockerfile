FROM node:slim

COPY . /app

WORKDIR /app

RUN npm install

RUN apt-get update
RUN apt-get install -y curl ffmpeg

ENTRYPOINT [ "npm", "start" ]

HEALTHCHECK --interval=5m --timeout=3s \
  CMD curl -f http://localhost:5000/ || exit 1