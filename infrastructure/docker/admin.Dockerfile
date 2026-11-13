# syntax=docker/dockerfile:1.7
# Build context: repository root.  docker build -f infrastructure/docker/admin.Dockerfile --build-arg VITE_API_URL=https://api.example.com .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
ARG VITE_API_URL=http://localhost:4000
ENV VITE_API_URL=$VITE_API_URL
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY apps/admin ./apps/admin
RUN pnpm install --frozen-lockfile --filter @mindbridge/admin... \
 && pnpm --filter @mindbridge/shared build \
 && pnpm --filter @mindbridge/admin build

FROM nginx:1.27-alpine
COPY infrastructure/docker/nginx-admin.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
