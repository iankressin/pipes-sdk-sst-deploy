# Pipes SDK Deploy Test

## Local Development (No AWS Required)

For local testing without AWS credentials, use docker-compose directly:

### Prerequisites

- Docker and Docker Compose
- Node.js and pnpm

### Setup

1. **Start everything with docker-compose**:

```bash
docker-compose up
```

This will:
- Start Postgres database
- Build and run the indexer container
- Automatically run migrations and start the indexer

### What's Running

- **Postgres**: Running in Docker container on port `5432`
- **Indexer**: Running in Docker container, connected to Postgres
- **No AWS**: Everything runs locally, no AWS credentials needed

### Stopping

Press `Ctrl+C` or run:
```bash
docker-compose down
```

---

## SST Dev Mode (Requires AWS Credentials)

**Note**: SST v3 requires AWS credentials even in dev mode because it sets up a dev environment in AWS. If you don't have AWS credentials configured, use the docker-compose method above instead.

If you have AWS credentials configured:

1. **Start the local Postgres database**:

```bash
docker-compose up -d postgres
```

2. **Start SST in dev mode**:

```bash
pnpm sst dev
```

This will:
- Connect to the local Postgres database (configured via `dev` prop in `sst.config.ts`)
- Run the indexer service locally using `pnpm start` (via `dev.command`)
- Automatically start the indexer when `sst dev` starts (`dev.autostart: true`)

### What Happens in SST Dev Mode

- **Postgres**: Uses the local Docker container instead of deploying RDS
- **Indexer Service**: Runs locally via `pnpm start` instead of deploying to ECS
- **AWS**: Some metadata/resources may be created in AWS for the dev environment

## Production Deployment

To deploy to AWS (not for local testing):

```bash
sst deploy --stage production
```

This will:
- Deploy RDS Postgres instance
- Deploy ECS cluster and service
- Build and push Docker image to ECR
- Run the indexer container in ECS

## Configuration

The `sst.config.ts` file is configured to:
- Use local Postgres in dev mode (`dev` prop)
- Run indexer locally in dev mode (`dev.command`)
- Deploy to AWS in production (when `sst deploy` is used)

