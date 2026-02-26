# WOS Community Platform

The premier centralized hub for Whiteout Survival (WOS) Alliances. Built to solve the real-world communication and coordination problems faced by mobile gaming communities.

![WOS Community Logo](/public/logo.svg)

## 🌟 Key Features

### 🛡️ Alliance Management
- **Dedicated Alliance Portals**: Secure, private spaces for alliance members to communicate.
- **Role-based Access Control**: Granular permissions for R5 (Leader), R4 (Officers), and R1-R3 (Members).
- **Ministry Reservations**: Automated scheduling system for sharing Server Ministries without conflict.

### 📅 Global Event Scheduling
- **Centralized Calendar**: Live tracking for Bear Traps, Crazy Joe, Castle Battles, and State vs. State prep.
- **Push Notifications**: Real-time Web Push alerts for upcoming events directly to user devices (iOS/Android/Desktop).
- **Timezone Sync**: Automatic conversion so international players never miss a rally.

### 🗣️ Cross-Alliance Communication
- **Global Message Boards**: Share strategies, recruitment posts, and server-wide announcements.
- **Private Messaging**: Direct messaging system for coordinating between alliance leaders.
- **Rich Text Editing**: Full Markdown support with image uploads for detailed game guides.

### 🔐 Secure Century Games Sync
- **Player ID Verification**: Users are cryptographically locked to their actual WOS Player ID.
- **Anti-Spoofing**: Display names and avatars are synced directly from the Century Games API to prevent impersonation.
- **7-Day Cooldown**: Strict profile refresh timers to limit API abuse and maintain consistent identities.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Database**: [PostgreSQL 15](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Google OAuth)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **PWA / Notifications**: Web Push API (`web-push`)

---

## 🛠️ Local Development

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [Node.js 20+](https://nodejs.org/)
- A Google Cloud Console project for OAuth Tokens

### 2. Environment Setup
Create a `.env` file in the `web/` directory based on `.env.example`:
```bash
# Example Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wos_community"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secure_secret"
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your_vapid_public"
VAPID_PRIVATE_KEY="your_vapid_private"
```

### 3. Start the Database
Spin up the local PostgreSQL container:
```bash
docker-compose up -d db
```

### 4. Push Schema & Run Next.js
Apply the Prisma database migrations and start the development server:
```bash
cd web
npm install
npx prisma migrate dev
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to view the application!

---

## 📦 Production Deployment

WOS Community is fully Dockerized for immediate production deployment via Portainer or any standard VPS.

```bash
# Spin up both the Database and the Next.js Production Build
docker-compose up --build -d
```
All environment variables for production are globally consolidated inside `docker-compose.yml`.

---
*Built for the players, by the players.*
