FROM node:16-alpine

# Install curl for healthcheck
RUN apk update
RUN apk upgrade
RUN apk --no-cache add curl


# Create app directory
WORKDIR /usr/src/app

# Copy project files
COPY . .

# Install dependencies
RUN npm ci

# Build project
RUN npm run build

EXPOSE 8080

CMD [ "npm", "run", "start" ]
