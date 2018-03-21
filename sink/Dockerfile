FROM node
COPY package.json /src/
RUN npm install
WORKDIR /src
CMD node --experimental-modules index.mjs
EXPOSE 8080
COPY . /src
