FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm i --silent
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
RUN npm i -g serve --silent
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
