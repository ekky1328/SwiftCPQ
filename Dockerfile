# Stage 1: Build the Vue 3 app using Vite and compile TypeScript for the server
FROM node:20 AS build

ARG VITE_IS_DEV_BUILD
ENV VITE_IS_DEV_BUILD=${VITE_IS_DEV_BUILD}

WORKDIR /client

COPY client/package.json client/package-lock.json ./
RUN npm install

COPY client/ ./
RUN npm run build

# Stage 2: Set up the Express server to serve the built Vue app and run compiled TypeScript
FROM node:20 AS production

WORKDIR /server

COPY server/package.json server/package-lock.json ./
RUN npm install

COPY server/ ./
RUN npm run build

COPY --from=build /client/dist /server/src/public

EXPOSE 5000

CMD ["npm", "run", "start"]
