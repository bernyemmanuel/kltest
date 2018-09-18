FROM node:8.9.3
COPY package.json package.json
RUN npm install
COPY . .
EXPOSE 3100
CMD ["npm", "start"]