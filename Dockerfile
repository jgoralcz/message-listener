# docker stop message-listener || true && docker rm message-listener || true && docker run -d -p 8998:8443 -v /etc/nginx/ssl/cert.key:/node/config/cert.key -v /etc/nginx/ssl/cert.pem:/node/config/cert.pem --restart always --restart always --memory="1024m" --cpu-shares=1024 --name message-listener message-listener
FROM node:latest

LABEL owner = jgoralcz
LABEL serviceVersion = 0.1.0
LABEL description = "Message Listener and Helper Bot"

ENV NODE_ENV=PROD

COPY --chown=node:node config.json /usr/src/node/
COPY --chown=node:node package*.json /usr/src/node/
COPY --chown=node:node src/ /usr/src/node/src/

WORKDIR /usr/src/node

USER node

RUN npm install

EXPOSE 8443
CMD ["npm", "start"]
