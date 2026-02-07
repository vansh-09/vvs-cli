# vvs-cli

An AI-powered CLI assistant with a modern web companion. It supports secure OAuth device flow, AI chat with Google Gemini, and persistent conversation history in PostgreSQL. The project is organized as a monorepo with a Node.js CLI server and a Next.js client UI.

We are currently in Phase 6 (Chat Feature Implementation).

## Why This Stands Out

- Production-style architecture (CLI + API + DB + Web UI)
- Real authentication flow (OAuth device flow)
- AI integration with tool-ready design
- Clean UX for both terminal and web

## Features

- AI chat via Google Gemini (AI SDK)
- OAuth 2.0 device flow authentication
- Persistent conversation history with PostgreSQL + Prisma
- Fast, friendly CLI UX (colors, prompts, spinners)
- Next.js web client for a polished demo experience

## Tech Stack

**Server (CLI + API)**

- Node.js (ESM)
- Express
- Prisma + PostgreSQL
- AI SDK + Google Gemini
- Better Auth (device flow)
- Commander.js, Chalk, Boxen, Clack

**Client (Web UI)**

- Next.js (App Router)
- TypeScript
- Tailwind CSS

## Project Structure

```
vvs-cli/
	client/   # Next.js web UI
	server/   # CLI + API + Prisma
```

## Phase Progress

- Phase 1: Project Initialization ✅
- Phase 2: Database Setup ✅
- Phase 3: Authentication (Better Auth) ✅
- Phase 4: Device Flow ✅
- Phase 5: Google AI Service Integration ✅
- Phase 6: Chat Feature Implementation ✅ (current)
- Phase 7: Tool Calling (planned)
- Phase 8: Agentic AI Mode (planned)

## Quick Start

### 1) Server (CLI + API)

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key
```

Run the server:

```bash
npm run dev
```

Use the CLI (after server install):

```bash
node src/cli/main.js
```

### 2) Client (Web UI)

```bash
cd client
npm install
npm run dev
```

Open http://localhost:3000


## Author

- Vansh Jain
- LinkedIn: https://linkedin.com/in/vanshjainx
- X: https://x.com/Vansh_codes

## License

MIT
