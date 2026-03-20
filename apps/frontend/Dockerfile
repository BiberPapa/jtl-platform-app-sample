# ---------- Stage 1 & 2: Build js-core and frontend ----------
FROM node:23-alpine AS build

ARG VITE_API_URL

WORKDIR /work

# 1️⃣ Copy both project dirs for caching
COPY src/sdk/js-core/package.json src/sdk/js-core/yarn.lock ./src/sdk/js-core/
COPY apps/frontend/package.json ./apps/frontend/

# Yarn workspaces monorepo: single lockfile at repo root.
# Copy root package.json + yarn.lock so installs in /apps/frontend use the root lock.
COPY yarn.lock ./ 
COPY package.json ./

# 2️⃣ Install js-core deps (cacheable)
WORKDIR /work/src/sdk/js-core
RUN yarn install --frozen-lockfile --ignore-scripts

# 3️⃣ Copy full source
WORKDIR /work
COPY src/sdk/js-core ./src/sdk/js-core
COPY apps/frontend ./apps/frontend

# 4️⃣ Build js-core
WORKDIR /work/src/sdk/js-core
RUN yarn build

# 5️⃣ Build frontend with local dist dependency
WORKDIR /work/apps/frontend
RUN yarn install --frozen-lockfile && yarn build

# ---------- Stage 3: Runtime ----------
FROM nginx:alpine AS final
COPY --from=build /work/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
