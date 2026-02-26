# Directive: Deploy to Production

## Goal
Deploy the "WOS Community Website" to a production environment using Docker, Portainer, and Nginx Proxy Manager. ensure the application is optimized (standalone build), secure (isolated DB), and accessible via the proxy.

## Inputs
- **Codebase**: Current git repository.
- **Environment Variables**:
  - `DATABASE_URL` (Internal Docker Network URL)
  - `NEXTAUTH_URL` (Public Domain)
  - `NEXTAUTH_SECRET`
  - `GOOGLE_CLIENT_ID` / `SECRET`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`

## Requirements
1.  **Docker Image**:
    - Use multi-stage build (`deps` -> `builder` -> `runner`).
    - Enable `output: 'standalone'` in Next.js config.
    - Run as non-root user (`nextjs`).
2.  **Orchestration (Docker Compose)**:
    - Service `web`: Restart always, connect to `proxy-tier` and `default` networks.
    - Service `db`: Restart always, internal network only (no exposed ports).
    - Network `proxy-tier`: External network for Nginx Proxy Manager.
3.  **Persistence**:
    - `postgres_data` volume for Database.
    - `uploads_data` volume mapping to `/app/public/uploads` for user content.
4.  **Security**:
    - Database must not be accessible from the public internet.
    - Environment variables must be injected at runtime (not baked into image).

## Execution Steps
1.  **Prepare Application**:
    - Ensure `next.config.ts` has `output: "standalone"`.
    - Verify `Dockerfile` is multi-stage.
    - Ensure `tsconfig.json` and type definitions (`src/types/next-auth.d.ts`) support strict build.
2.  **Configure Docker Compose**:
    - Define services `web` and `db`.
    - Define `external: true` network `proxy-tier`.
3.  **Build & Verify**:
    - Run `docker-compose build web` to ensure strict TypeScript checks pass.
    - Run `docker-compose up -d` to verify startup.
4.  **Deployment (Portainer)**:
    - Connect Stack to Git repository.
    - Set environment variables in Stack details.
    - Deploy Stack.

## Edge Cases
- **TypeScript Errors**: The build environment is stricter than dev. Explicitly declare global types in `src/types/` and ensure `tsconfig.json` includes them.
- **Prisma Client**: `Dockerfile` must run `npx prisma generate` before build.
