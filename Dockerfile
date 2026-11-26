# Portable production image for any Docker-compatible Node.js host.
FROM node:22-alpine AS runner
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
WORKDIR /app

# Next.js standalone output contains the minimal server and production dependencies.
COPY .next/standalone ./
COPY .next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
