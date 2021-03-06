# 1: Dev
FROM node:12-alpine

ENV NODE_PATH=/node_modules
ENV PATH=$PATH:/node_modules/.bin

WORKDIR /app

# Install bash dependency
RUN apk add --no-cache bash

# Add config files
ADD package.json ./package.json
ADD yarn.lock ./yarn.lock
ADD lerna.json ./lerna.json
ADD tsconfig.json ./tsconfig.json

# Add monrepo utilities
ADD bin ./bin

# Add source code
ADD packages/core ./packages/core
ADD packages/client ./packages/client
ADD packages/ui ./packages/ui
ADD packages/utils ./packages/utils
ADD packages/ecs ./packages/ecs

# Fix npm warning
RUN npm config set scripts-prepend-node-path true

# Install dev and project dependencies
RUN yarn
RUN yarn bootstrap

# Start development app
CMD ["yarn", "dev:client"]
