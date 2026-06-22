# Build a single self-contained bundle, then run it on a slim runtime.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
# Standalone build (no monorepo context): only ws + esbuild are needed to bundle.
RUN npm install --no-audit --no-fund --no-save ws esbuild
COPY build.mjs tsconfig.json ./
COPY src ./src
RUN node build.mjs

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=6001
COPY --from=build /app/dist ./dist
EXPOSE 6001
# Auth is opt-in via env: WISP_TOKEN, ALLOWED_ORIGINS (see README).
CMD ["node", "dist/node.mjs"]
