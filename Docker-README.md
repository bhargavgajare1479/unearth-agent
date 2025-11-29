# Docker Support for Unearth Agent

This document explains how to run the Unearth Agent project inside a Docker container.

## Build and Run (Production)

1. Build image:

```powershell
# In the repository root
docker build -t unearth-agent:latest .
```

2. Run:

```powershell
# Run with port mapping 9002:9002
docker run -p 9002:9002 --rm --name unearth-agent unearth-agent:latest
```

Or use docker-compose:

```powershell
docker-compose up --build
```

## Develop inside a container

You can use the dev Dockerfile with bind mounts for a reproducible environment:

```powershell
docker build -f Dockerfile.dev -t unearth-agent:dev .
docker run -p 9002:9002 -v ${pwd}:/app -v /app/node_modules -it unearth-agent:dev
```

## Notes

- The app listens on port 9002; the Docker setup maps port 9002 to the host by default.
- The extension static files are located under `public/extension` and will be copied into the container. If you're building the extension via `npm run build:extension`, the public extension files will also be included.
- The local analyze endpoint (`/api/analyze`) is served by Next.js and will be available inside the container at `http://localhost:9002/api/analyze`.
- If the app needs environment variables, configure them in a `.env` file and either pass them via `--env-file` or add them to the `docker-compose.yml`.

## Troubleshooting

- If the Next.js process fails with `next: command not found`, ensure the build stage completed successfully; check `npm ci` and `npm run build` logs.
- If your container needs extra Node binary or native dependencies, consider changing the base image from `node:20-alpine` to `node:20-bullseye` for better compatibility, at the cost larger image size.
