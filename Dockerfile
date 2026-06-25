FROM node:24.11.0-alpine

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@9.14.0 --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 8080

CMD ["node", "--max-old-space-size=7168", "--report-on-fatalerror", "--report-directory=/tmp", "--require", "tsx/cjs", "src/main.ts"]
