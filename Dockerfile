# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json (if available) to the working directory
# to install dependencies
COPY package*.json ./

# Install app dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose the port that the app listens on
EXPOSE 8080

# Run the web service on container startup
CMD [ "npm", "start" ]