/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
    app(input) {
      return {
        name: 'pipes-sdk-deploy-test',
        home: 'aws',
        providers: { railway: '0.4.4' },
      }
    },
    async run() {
      // Create Railway provider with token from environment variable
      const railwayProvider = new railway.Provider('RailwayProvider', {
        token: process.env.RAILWAY_TOKEN,
      })

      const providerOpts = { provider: railwayProvider }

      /**
       * Create Railway project
       * Note: teamId (workspaceId) is required by Railway API
       * Get your workspace ID from Railway dashboard: Cmd/Ctrl + K -> "Copy Active Workspace ID"
       */
      const project = new railway.Project('PipesProject', {
        name: 'pipes-sdk-deploy-test',
        teamId: process.env.RAILWAY_TEAM_ID,
      }, providerOpts)
  
      /**
       * Get or create environment (Railway projects have a default environment)
       * You can also create a custom environment if needed
       */
      const environment = new railway.Environment('Production', {
        name: 'production',
        projectId: project.id,
      }, providerOpts)
  
      // Deploy Postgres as a service using Postgres Docker image
      const postgres = new railway.Service('Postgres', {
        name: 'postgres',
        projectId: project.id,
        sourceImage: 'postgres:17',
        /**
         * Postgres environment variables
         * Note: Railway will automatically expose these as service variables
         * You'll need to set them via railway.Variable after service creation
         */
      }, providerOpts)
  
      // Set Postgres environment variables
      new railway.Variable('PostgresUser', {
        environmentId: environment.id,
        serviceId: postgres.id,
        name: 'POSTGRES_USER',
        value: 'postgres',
      }, providerOpts)
  
      new railway.Variable('PostgresPassword', {
        environmentId: environment.id,
        serviceId: postgres.id,
        name: 'POSTGRES_PASSWORD',
        value: 'password',
      }, providerOpts)
  
      new railway.Variable('PostgresDb', {
        environmentId: environment.id,
        serviceId: postgres.id,
        name: 'POSTGRES_DB',
        value: 'pipes',
      }, providerOpts)
  
      /**
       * Railway provides service URLs via environment variables
       * You'll need to reference the postgres service's internal URL
       */
      const dbConnectionString = $interpolate`postgresql://postgres:password@${postgres.name}:5432/pipes`
  
      // Deploy Indexer service from Docker image
      const indexer = new railway.Service('Indexer', {
        name: 'indexer',
        projectId: project.id,
        /**
         * If you want to build from a GitHub repo
         * Make sure to have your Github account linked to Railway
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
      }, providerOpts)
  
      // Set database connection string for indexer
      new railway.Variable('IndexerDbConnection', {
        environmentId: environment.id,
        serviceId: indexer.id,
        name: 'DB_CONNECTION_STR',
        value: dbConnectionString,
      }, providerOpts)
  
      // Set other indexer environment variables if needed
      new railway.Variable('IndexerNodeEnv', {
        environmentId: environment.id,
        serviceId: indexer.id,
        name: 'NODE_ENV',
        value: 'production',
      }, providerOpts)
  
      return {
        projectId: project.id,
        postgresServiceId: postgres.id,
        indexerServiceId: indexer.id,
      }
    },
  })