FROM node:16-alpine
FROM mcr.microsoft.com/playwright:v1.28.1-focal

# Set the work directory for the application
WORKDIR /e2e

# Copy project files
COPY . .

# Install dependencies
RUN npm ci

# Set the environment path to node_modules/ .bin
ENV PATH /e2e/node_modules/.bin:$PATH

# Run the e2e test command
ENTRYPOINT echo "🧪 Running E2E Tests" && npx playwright test $ADDITIONAL_ARGS
