FROM node
WORKDIR /app

COPY package.json /app/
RUN npm install

EXPOSE 8080
COPY . /app

# Does not work:
# RUN ln -s index.js index.mjs
RUN cp index.js index.mjs

CMD node --experimental-modules index.mjs
