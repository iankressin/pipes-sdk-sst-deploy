/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: 'pipes-sdk-deploy-test',
      home: 'local',
      providers: { railway: '0.4.4' },
    }
  },
  async run() {
    // Create Railway provider with token from environment variable
    const railwayProvider = new railway.Provider('RailwayProvider', {
      token:
        process.env.RAILWAY_TOKEN ??
        (() => {
          throw new Error('RAILWAY_TOKEN is not set')
        })(),
    })

    const providerOpts = { provider: railwayProvider }

    /**
     * Create Railway project
     * Note: teamId (workspaceId) is required by Railway API
     * Get your workspace ID from Railway dashboard: Cmd/Ctrl + K -> "Copy Active Workspace ID"
     */
    const project = new railway.Project(
      'pipes-project',
      {
        name: 'pipes-project',
        teamId:
          process.env.RAILWAY_TEAM_ID ??
          (() => {
            throw new Error('RAILWAY_TEAM_ID is not set')
          })(),
      },
      providerOpts,
    )

    // const environment = railway.Environment.get(
    //   'production',
    //   process.env.RAILWAY_ENVIRONMENT_ID ??
    //     (() => {
    //       throw new Error('RAILWAY_ENVIRONMENT_ID is not set')
    //     })(),
    //   {
    //     projectId: project.id,
    //   },
    //   providerOpts,
    // )
    const environmentId = project.defaultEnvironment.id

    /**
     * Postgres environment variables
     * Note: Railway will automatically expose these as service variables
     * You'll need to set them via railway.Variable after service creation
     */
    const postgres = new railway.Service(
      'Postgres',
      {
        name: 'Postgres',
        projectId: project.id,
        sourceImage: 'postgres:17',
      },
      providerOpts,
    )

    const pguser = new railway.Variable(
      'PostgresUser',
      {
        environmentId,
        serviceId: postgres.id,
        name: 'POSTGRES_USER',
        value: 'postgres',
      },
      providerOpts,
    )
    const pgpassword = new railway.Variable(
      'PostgresPassword',
      {
        environmentId,
        serviceId: postgres.id,
        name: 'POSTGRES_PASSWORD',
        value: 'password',
      },
      providerOpts,
    )
    const pgdb = new railway.Variable(
      'PostgresDb',
      {
        environmentId,
        serviceId: postgres.id,
        name: 'POSTGRES_DB',
        value: 'pipes',
      },
      providerOpts,
    )

    // biome-ignore lint: Railway variable syntax
    const postgresUrl = $interpolate`postgresql://${pguser.value}:${pgpassword.value}@${'${{ Postgres.RAILWAY_PRIVATE_DOMAIN }}'}:5432/${pgdb.value}`

    // Deploy Indexer service from Docker image
    const indexer = new railway.Service(
      'swaps-and-transfers',
      {
        name: 'swaps-and-transfers',
        projectId: project.id,
        /**
         * If you want to build from a GitHub repo
         * Make sure to have your Github account linked to Railway and
         * Railway has permission to access the repo
         */
        sourceRepo: 'iankressin/pipes-sdk-sst-deploy',
        sourceRepoBranch: 'main',

        /**
         * If you want to build from a Docker image, use the following:
         *
         * sourceImage: 'your-registry/indexer:latest',
         * sourceImageRegistryUsername: 'your-registry-username',
         * sourceImageRegistryPassword: 'your-registry-password',
         */
      },
      providerOpts,
    )

    new railway.Variable(
      'indexer-db-connection',
      {
        environmentId,
        serviceId: indexer.id,
        name: 'DB_CONNECTION_STR',
        value: postgresUrl,
      },
      providerOpts,
    )

    return {
      projectId: project.id,
      postgresServiceId: postgres.id,
      indexerServiceId: indexer.id,
    }
  },
})
