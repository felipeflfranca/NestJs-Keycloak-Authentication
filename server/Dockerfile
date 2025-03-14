# Uses a lightweight base image of Node.js
FROM node:18-alpine

# Sets the working directory inside the container
WORKDIR /app

# Copies package.json and package-lock.json before installing dependencies
COPY package*.json ./

# Installs dependencies
RUN npm install

# Copies all source code into the container
COPY . .

# Exposes the application port
EXPOSE 3000

# Command to start the server
CMD ["npm", "run", "start:dev"]
