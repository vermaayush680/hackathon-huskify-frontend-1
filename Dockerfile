# Use official Node.js LTS image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install 
# RUN npm install -g vite

# Copy the rest of the application code
COPY . .

# Expose the port (change if your app uses a different port)
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start"]
