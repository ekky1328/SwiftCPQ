# Azure Bicep - Infrastructure as Code

These Bicep templates provision the full SwiftCPQ Azure infrastructure in a single command - no clicking through the portal or running individual `az` commands.

**What gets created:**
- Azure Container Registry (ACR) with a user-assigned managed identity for image pulls
- Log Analytics workspace
- Container Apps managed environment
- PostgreSQL Flexible Server + database + firewall rule
- `swiftcpq` container app (public ingress)
- `swiftcpq-templater` container app (internal ingress only)

---

## main.bicep

Save as `infra/azure/main.bicep` (or anywhere - the path doesn't matter as long as you reference it when deploying).

```bicep
@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Name of the Azure Container Registry (globally unique, lowercase, no hyphens)')
param acrName string

@description('Name of the PostgreSQL Flexible Server (globally unique)')
param pgServerName string

@description('PostgreSQL admin username')
param pgAdminUser string

@description('PostgreSQL admin password')
@secure()
param pgAdminPassword string

@description('Name of the Container Apps managed environment')
param containerAppEnvName string = 'swiftcpq-env'

@description('Name of the main SwiftCPQ container app')
param mainAppName string = 'swiftcpq'

@description('Name of the templater container app')
param templaterAppName string = 'swiftcpq-templater'

@description('JWT signing secret for access tokens')
@secure()
param jwtSecret string

@description('JWT signing secret for refresh tokens')
@secure()
param jwtRefreshSecret string

@description('Shared secret between main app and templater')
@secure()
param internalServiceToken string

@description('Allowed CORS origin - your public frontend URL')
param corsOrigin string

@description('Entra Client ID - leave empty to disable Entra login')
param entraClientId string = ''

@description('Entra Client Secret')
@secure()
param entraClientSecret string = ''

@description('Entra Tenant ID')
param entraTenantId string = ''

@description('Entra OAuth redirect URI')
param entraRedirectUri string = ''

// --- Container Registry -------------------------------------------------------
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false // managed identity handles pulls
  }
}

// --- Managed Identity (AcrPull) -----------------------------------------------
resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${mainAppName}-identity'
  location: location
}

var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
resource acrPullAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(acr.id, identity.id, acrPullRoleId)
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
    principalId: identity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// --- Log Analytics ------------------------------------------------------------
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${containerAppEnvName}-logs'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// --- Container Apps Environment -----------------------------------------------
resource env 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// --- PostgreSQL Flexible Server -----------------------------------------------
resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: pgServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: pgAdminUser
    administratorLoginPassword: pgAdminPassword
    storage: { storageSizeGB: 32 }
    backup: { backupRetentionDays: 7, geoRedundantBackup: 'Disabled' }
    highAvailability: { mode: 'Disabled' }
    network: { publicNetworkAccess: 'Enabled' }
  }
}

resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pgServer
  name: 'swiftcpq'
  properties: { charset: 'UTF8', collation: 'en_US.utf8' }
}

// Allow connections from Azure services (0.0.0.0 is the Azure magic sentinel)
resource pgFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pgServer
  name: 'AllowAzureServices'
  properties: { startIpAddress: '0.0.0.0', endIpAddress: '0.0.0.0' }
}

var databaseUrl = 'postgres://${pgAdminUser}:${pgAdminPassword}@${pgServer.properties.fullyQualifiedDomainName}:5432/swiftcpq?sslmode=require'

// --- Templater (internal) -----------------------------------------------------
resource templater 'Microsoft.App/containerApps@2024-03-01' = {
  name: templaterAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      registries: [{ server: acr.properties.loginServer, identity: identity.id }]
      ingress: { external: false, targetPort: 5005 }
      secrets: [
        { name: 'internal-token', value: internalServiceToken }
      ]
    }
    template: {
      containers: [
        {
          name: 'templater'
          // Use a placeholder on first deploy; CI/CD will update to the real image
          image: '${acr.properties.loginServer}/swiftcpq-templater:latest'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'MAIN_SERVER_URL', value: 'http://${mainAppName}' }
            { name: 'INTERNAL_SERVICE_TOKEN', secretRef: 'internal-token' }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 1 }
    }
  }
  dependsOn: [acrPullAssignment]
}

// --- Main App (public) --------------------------------------------------------
resource mainApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: mainAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    managedEnvironmentId: env.id
    configuration: {
      registries: [{ server: acr.properties.loginServer, identity: identity.id }]
      ingress: { external: true, targetPort: 5000, transport: 'auto' }
      secrets: [
        { name: 'database-url', value: databaseUrl }
        { name: 'jwt-secret', value: jwtSecret }
        { name: 'jwt-refresh-secret', value: jwtRefreshSecret }
        { name: 'internal-token', value: internalServiceToken }
        { name: 'entra-client-secret', value: entraClientSecret }
      ]
    }
    template: {
      containers: [
        {
          name: 'swiftcpq'
          image: '${acr.properties.loginServer}/swiftcpq:latest'
          resources: { cpu: json('0.5'), memory: '1Gi' }
          env: [
            { name: 'NODE_ENV', value: 'production' }
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
            { name: 'JWT_REFRESH_SECRET', secretRef: 'jwt-refresh-secret' }
            { name: 'CORS_ORIGIN', value: corsOrigin }
            { name: 'INTERNAL_SERVICE_TOKEN', secretRef: 'internal-token' }
            { name: 'TEMPLATER_URL', value: 'https://${templater.properties.configuration.ingress.fqdn}' }
            { name: 'ENTRA_CLIENT_ID', value: entraClientId }
            { name: 'ENTRA_CLIENT_SECRET', secretRef: 'entra-client-secret' }
            { name: 'ENTRA_TENANT_ID', value: entraTenantId }
            { name: 'ENTRA_REDIRECT_URI', value: entraRedirectUri }
          ]
        }
      ]
      scale: { minReplicas: 1, maxReplicas: 3 }
    }
  }
  dependsOn: [acrPullAssignment, templater]
}

// --- Outputs ------------------------------------------------------------------
output acrLoginServer string = acr.properties.loginServer
output mainAppFqdn string = mainApp.properties.configuration.ingress.fqdn
output templaterFqdn string = templater.properties.configuration.ingress.fqdn
```

---

## main.bicepparam

Save alongside `main.bicep`. Secrets are read from environment variables at deploy time - never hard-code them.

```bicep
using './main.bicep'

param acrName             = 'swiftcpqregistry'     // must be globally unique
param pgServerName        = 'swiftcpq-pg'           // must be globally unique
param pgAdminUser         = 'swiftcpqadmin'
param pgAdminPassword     = readEnvironmentVariable('PG_ADMIN_PASSWORD')
param jwtSecret           = readEnvironmentVariable('JWT_SECRET')
param jwtRefreshSecret    = readEnvironmentVariable('JWT_REFRESH_SECRET')
param internalServiceToken = readEnvironmentVariable('INTERNAL_SERVICE_TOKEN')
param corsOrigin          = 'https://your-domain.com'

// Entra - remove these lines or leave as '' to keep Entra disabled
param entraClientId       = readEnvironmentVariable('ENTRA_CLIENT_ID')
param entraClientSecret   = readEnvironmentVariable('ENTRA_CLIENT_SECRET')
param entraTenantId       = readEnvironmentVariable('ENTRA_TENANT_ID')
param entraRedirectUri    = 'https://your-domain.com/api/v1/auth/entra/callback'
```

---

## Recommended: Use Azure Key Vault for Secrets

The `main.bicepparam` file above reads secrets from environment variables (`readEnvironmentVariable`). This is fine for a single developer running deploys locally, but for team environments or CI/CD it is better to store secrets in **Azure Key Vault** and pull them directly in the params file using `getSecret()`.

### Create a Key Vault and store secrets

```bash
az keyvault create \
  --name swiftcpq-kv \
  --resource-group swiftcpq-rg \
  --location australiaeast \
  --enable-rbac-authorization true

az role assignment create \
  --assignee $(az ad signed-in-user show --query id -o tsv) \
  --role "Key Vault Secrets Officer" \
  --scope $(az keyvault show --name swiftcpq-kv --query id -o tsv)

az keyvault secret set --vault-name swiftcpq-kv --name pg-admin-password      --value "YourStrongPassword"
az keyvault secret set --vault-name swiftcpq-kv --name jwt-secret             --value "YourJwtSecret"
az keyvault secret set --vault-name swiftcpq-kv --name jwt-refresh-secret     --value "YourJwtRefreshSecret"
az keyvault secret set --vault-name swiftcpq-kv --name internal-service-token --value "YourInternalServiceToken"
az keyvault secret set --vault-name swiftcpq-kv --name entra-client-secret    --value "YourEntraSecret"
```

### Update main.bicepparam to use getSecret()

Replace `readEnvironmentVariable(...)` calls with `getSecret()` - Bicep resolves these at deploy time without the values ever touching your shell or CI logs:

```bicep
using './main.bicep'

param subscriptionId       = '<subscription-id>'
param rgName               = 'swiftcpq-rg'
param acrName              = 'swiftcpqregistry'
param pgServerName         = 'swiftcpq-pg'
param pgAdminUser          = 'swiftcpqadmin'
param corsOrigin           = 'https://your-domain.com'

param pgAdminPassword      = az.getSecret(subscriptionId, 'rgName', 'swiftcpq-kv', 'pg-admin-password')
param jwtSecret            = az.getSecret(subscriptionId, 'rgName', 'swiftcpq-kv', 'jwt-secret')
param jwtRefreshSecret     = az.getSecret(subscriptionId, 'rgName', 'swiftcpq-kv', 'jwt-refresh-secret')
param internalServiceToken = az.getSecret(subscriptionId, 'rgName', 'swiftcpq-kv', 'internal-service-token')
param entraClientSecret    = az.getSecret(subscriptionId, 'rgName', 'swiftcpq-kv', 'entra-client-secret')
```

> The identity running `az deployment group create` needs the **Key Vault Secrets User** role on the vault. For CI/CD service principals, assign this role the same way you assigned Contributor.

---

## Deploying the Bicep Template

### First deploy

```bash
# Set secrets as environment variables (or export from a secrets manager)
export PG_ADMIN_PASSWORD="..."
export JWT_SECRET="..."
export JWT_REFRESH_SECRET="..."
export INTERNAL_SERVICE_TOKEN="..."

# Create the resource group first
az group create --name swiftcpq-rg --location australiaeast

# Deploy
az deployment group create \
  --resource-group swiftcpq-rg \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/main.bicepparam
```

The outputs will print the public FQDN of the main app and the ACR login server.

### After first deploy - push images and run migrations

The container apps are created with `image: .../swiftcpq:latest`, but that image won't exist in ACR yet. Build and push first:

```bash
ACR=$(az deployment group show \
  --resource-group swiftcpq-rg \
  --name main \
  --query properties.outputs.acrLoginServer.value -o tsv)

az acr login --name swiftcpqregistry

docker build -t $ACR/swiftcpq:latest . && docker push $ACR/swiftcpq:latest
docker build -t $ACR/swiftcpq-templater:latest ./templater && docker push $ACR/swiftcpq-templater:latest

# Trigger a new revision so Container Apps pulls the image
az containerapp update --name swiftcpq --resource-group swiftcpq-rg --image $ACR/swiftcpq:latest
az containerapp update --name swiftcpq-templater --resource-group swiftcpq-rg --image $ACR/swiftcpq-templater:latest

# Run migrations and seed
az containerapp exec --name swiftcpq --resource-group swiftcpq-rg --command "npm run migrate:up"
az containerapp exec --name swiftcpq --resource-group swiftcpq-rg --command "npm run seed"
```

### Subsequent deploys (Only when infrastructure changes)

Re-running `az deployment group create` with the same template is idempotent - it only updates what changed.

```bash
az deployment group create \
  --resource-group swiftcpq-rg \
  --template-file infra/azure/main.bicep \
  --parameters infra/azure/main.bicepparam
```
