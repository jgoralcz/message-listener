# docker container run -d -m 150m --restart always -v /etc/localtime:/etc/localtime -p 8998:8998 --name message-listener
FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

# install our packages.
RUN npm install

# Bundle app source
COPY . .

EXPOSE 8998

CMD ["node", "src/index.js"]
