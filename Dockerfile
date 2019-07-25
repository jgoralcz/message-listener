FROM node:12

WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# install pm2 and our packages.
RUN npm install pm2 -g && npm install

# Bundle app source
COPY . .

EXPOSE 8998

CMD ["pm2-runtime", "./src/index.js"]
#CMD ["node", "index.js"]
