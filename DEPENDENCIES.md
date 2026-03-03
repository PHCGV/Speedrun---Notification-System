# Dependencies List

This document lists all technologies and packages required to run the Notification System.

## System Requirements

- **Operating System**: Windows 10/11, Linux (Ubuntu, CentOS, etc), or macOS
- **Node.js**: v14 or higher (LTS recommended)
- **npm or yarn**: comes with Node.js
- **Git**: for cloning the repository
- **Docker & Docker Compose**: optional but recommended for containerized deployment

## Node.js Dependencies (backend)

These are defined in `backend/package.json` and installed via `npm install` or `npm ci`:

```
express@^4.18.2
socket.io@^4.5.4
jsonwebtoken@^9.0.0
bcryptjs@^2.4.3
better-sqlite3@^8.5.0    # requires build tools; may fail on Node 22+ (Windows)
dotenv@^16.0.3
axios@^1.3.4
cors@^2.8.5
express-validator@^7.0.0

devDependencies:
  nodemon@^2.0.20
```

> **Nota**: se estiver usando Node.js 22 ou superior em Windows, a compilação de `better-sqlite3` pode falhar devido a incompatibilidades com V8. Utilize Node 18/20 ou execute a aplicação dentro de um container Docker para contornar esse problema.
## Browser/Frontend Requirements

- A modern browser (Chrome, Firefox, Edge, Safari) with:
  - WebSocket support
  - Web Audio API
  - Notification API
  - ES6+ JavaScript support

## Optional APIs and Services

- **Translation API**: Uses [MyMemory Translated](https://mymemory.translated.net/get) by default. No credentials required for free usage.

## Additional Tools Used in Development

- **SQLite**: built-in via `better-sqlite3` (zero-config)
- **Postman or curl**: for testing HTTP endpoints
- **VS Code** (or any code editor) for editing files

## Installation Notes

1. After cloning the repo, navigate to `backend` and run:
   ```bash
   npm install
   ```
2. You can optionally run in Docker using:
   ```bash
   docker-compose up
   ```
3. The system will automatically create the SQLite database and seed demo users.

---

This file should help you identify all the dependencies that need to be installed or are required for running the project.