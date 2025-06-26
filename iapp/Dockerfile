FROM node:18-slim
# Avoid node 22 for now; tfjs-node support is better on LTS

# Install build deps & shared libs required for tfjs-node
RUN apt-get update && apt-get install -y \
    python3 make g++ libc6-dev libsm6 libxext6 libxrender1 \
    libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install deps with native rebuild
COPY package*.json ./

# Install and rebuild tfjs-node from source
RUN npm install --build-from-source @tensorflow/tfjs-node

# Then install the rest
RUN npm install

# Copy all app code
COPY . .

ENTRYPOINT ["node", "/app/src/app.js"]
