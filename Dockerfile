FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY . .

EXPOSE 8080

ENV PORT=8080

CMD ["npm", "run", "server"]
