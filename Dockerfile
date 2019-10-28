# docker stop message-listener && docker rm message-listener && docker run -d -p 8998:8998 --restart always --memory="1024m" --cpu-shares=1024 --name message-listener message-listener
FROM node:latest

LABEL owner = jgoralcz
LABEL serviceVersion = 0.1.0
LABEL description = "Message Listener and Helper Bot"

ENV NODE_ENV=PROD

COPY --chown=node:node config.json /usr/src/node/
COPY --chown=node:node package*.json /usr/src/node/
COPY --chown=node:node src/ /usr/src/node/src/

WORKDIR /usr/src/node

EXPOSE 8998

USER node

RUN npm install

CMD ["npm", "start"]