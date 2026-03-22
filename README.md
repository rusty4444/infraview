# InfraView

A unified self-hosted infrastructure dashboard that combines data from **Netdata**, **Uptime Kuma**, and **Backrest** into one clean interface.

![Dark mode dashboard](https://img.shields.io/badge/theme-dark%20%2F%20light-blue)

## Features

- **System Metrics** (Netdata): CPU, RAM, disk, network KPI cards with live area charts (10-minute window, 5s refresh)
- **Uptime Monitors** (Uptime Kuma): Monitor status cards with response times, certificate expiry, and up/down counts
- **Backup Status** (Backrest): Repository overview and backup plan cards with last run status and timing
- **Settings UI**: Configure service endpoints through the web interface — no config files needed
- **Dark / Light Mode**: Toggle between themes
- **Auto-refresh**: Data refreshes automatically at appropriate intervals per service
- **Environment seeding**: Pre-configure services via environment variables on first launch

## Quick Start with Docker

```bash
cp .env.example .env
# Edit .env with your service URLs and credentials
docker compose up -d
```

Open `http://localhost:3080` and your services should appear on the dashboard.

The repo ships with a pre-built `dist/` directory, so no compilation is needed during `docker build` — it just copies the files and installs runtime dependencies. Builds are fast even on low-powered hardware like NAS devices.

## Quick Start without Docker

The pre-built output is included in the repo, so you can run directly:

```bash
npm install --omit=dev
NODE_ENV=production node dist/index.cjs
```

Open `http://localhost:5000`.

## Configuration

### Option 1: Environment Variables (recommended for Docker)

Copy `.env.example` to `.env` and fill in your values. These are used to seed the database on first launch only — after that, manage everything from the Settings page.

```env
NETDATA_URL=http://your-host:19999
UPTIMEKUMA_URL=http://your-host:3001
UPTIMEKUMA_API_KEY=your_prometheus_api_key
BACKREST_URL=http://your-host:9898
BACKREST_USERNAME=your_username
BACKREST_PASSWORD=your_password
```

### Option 2: Web UI

Navigate to Settings (gear icon) and add services manually.

## Service Setup Notes

### Netdata
- Uses the [Agent REST API](https://learn.netdata.cloud/docs/developer-and-contributor-corner/rest-api) (`/api/v1/data`, `/api/v1/info`, `/api/v1/alarms`)
- No authentication required by default

### Uptime Kuma
- Reads from the `/metrics` [Prometheus endpoint](https://github.com/louislam/uptime-kuma/wiki/Prometheus-Integration)
- Supports basic auth (username/password) or a Prometheus API key

### Backrest
- Connects via the [gRPC-Web/Connect protocol](https://github.com/garethgeorge/backrest) (`/v1/GetConfig`, `/v1/GetOperations`)
- Uses basic auth with your Backrest credentials

## Docker Networking

If your monitored services run on the Docker host (common for NAS setups):

```yaml
# In docker-compose.yml, uncomment:
extra_hosts:
  - "host.docker.internal:host-gateway"
```

Then use `http://host.docker.internal:<port>` as the service URL.

If services are on the same Docker network, use container names directly.

## Architecture

- **Frontend**: React + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Express.js proxy (avoids CORS issues with your services)
- **Database**: SQLite for service configuration storage
- **Data flow**: Browser → Express proxy → Your services' APIs

The repo includes pre-built output in `dist/` so Docker builds don't require any compilation tooling. The Dockerfile simply copies the built files and installs production Node.js dependencies.

## Development

To make changes to the source and rebuild:

```bash
npm install
npm run dev
```

Dev server runs on port 5000 with hot reload.

To rebuild the production bundle after making changes:

```bash
npm run build
```

This regenerates the `dist/` directory. Commit the updated `dist/` if you want your Docker builds to pick up the changes.

## License

MIT
