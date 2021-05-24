FROM node:current-alpine3.11

LABEL owner = jgoralcz
LABEL serviceVersion = 0.1.1
LABEL description = "Message Listener and Helper Bot"

COPY --chown=node:node package*.json /usr/src/node/
COPY --chown=node:node src/ /usr/src/node/src/

WORKDIR /usr/src/node

USER node

RUN npm install

EXPOSE 8443
CMD ["npm", "start"]
