FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Give TypeScript more heap during build.
# Your EC2 has 2 GB swap, so 768 MB is a reasonable starting point.
ENV NODE_OPTIONS="--max-old-space-size=768"

RUN npm run build

RUN npm prune --omit=dev

FROM node:20-slim AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 5001

CMD ["npm", "start"]