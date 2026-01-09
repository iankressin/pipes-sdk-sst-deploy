/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: 'pipes-sdk-deploy-test',
      // removal: input?.stage === 'production' ? 'retain' : 'remove',
      // protect: ["production"].includes(input?.stage),
      home: 'aws',
      providers: { railway: '0.4.4' },
    }
  },
  async run() {
    new railway.Project('pipes-sdk-deploy-test', {

    })

    // Create VPC for resources (only needed for production)
    const vpc = new sst.aws.Vpc('Vpc')
    /**
     * Postgres database matching docker-compose.yml
     * In dev mode, connects to local Postgres running via docker-compose
     */
    const postgres = new sst.aws.Postgres('Postgres', {
      vpc,
      database: 'pipes',
      username: 'postgres',
      password: 'password',
      dev: {
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'password',
        database: 'pipes',
      },
    })
    const cluster = new sst.aws.Cluster('Cluster', { vpc })
    const connectionString = $interpolate`postgresql://${postgres.username}:${postgres.password}@${postgres.host}:${postgres.port}/${postgres.database}`

    /**
     * Indexer container service matching docker-compose.yml
     * In dev mode, runs locally via dev.command instead of deploying to ECS
     */
    new sst.aws.Service('Indexer', {
      cluster,
      link: [postgres],
      containers: [
        {
          name: 'indexer',
          image: {
            context: '.',
            dockerfile: 'Dockerfile',
          },
          environment: {
            DB_CONNECTION_STR: connectionString,
          },
          command: [
            'sh',
            '-lc',
            'pnpm db:generate && pnpm db:migrate && node dist/index.js',
          ],
        },
      ],
      dev: {
        command: 'pnpm db:generate && pnpm db:migrate && pnpm start',
        autostart: true,
      },
    })

    return {
      postgres: {
        connectionString,
        host: postgres.host,
        port: postgres.port,
        database: postgres.database,
        username: postgres.username,
      },
    }
  },
})
