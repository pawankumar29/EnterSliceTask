FROM node:18-alpine
WORKDIR /app

# Install runtime deps
COPY package.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

ENV NODE_ENV=production

CMD ["node", "run.js"]