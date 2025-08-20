# Use Node 18 slim image
FROM node:18-slim

# Install python for yt-dlp
RUN apt-get update && \
    apt-get install -y python3-pip && \
    pip3 install yt-dlp && \
    apt-get clean

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port
EXPOSE 5001

# Start the server
CMD ["node", "server.js"]
