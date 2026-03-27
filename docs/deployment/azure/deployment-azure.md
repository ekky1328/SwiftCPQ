# Deploying to Azure

> For self-hosted / VM deployment, see [../self-hosted/deployment.md](../self-hosted/deployment.md).

**Additional Azure guides:**
- [Bicep - Infrastructure as Code](bicep.md)
- [CI/CD Pipelines - GitHub Actions & Azure DevOps](pipelines.md)

---

The recommended Azure setup uses:

| Service | Purpose |
|---------|---------|
| **Azure Container Registry (ACR)** | Store Docker images |
| **Azure Container Apps** | Run the app and templater containers |
| **Azure Database for PostgreSQL – Flexible Server** | Managed PostgreSQL |

Azure Container Apps is preferred over App Service here because it natively supports multiple containers with internal-only networking - the templater never needs a public URL.

---

## Prerequisites

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed and logged in (`az login`)
- Docker installed locally
- An Azure subscription

Set shell variables to avoid repeating yourself throughout these steps:

```bash
RESOURCE_GROUP=swiftcpq-rg
LOCATION=australiaeast          # change to your preferred region
ACR_NAME=swiftcpqregistry       # must be globally unique, lowercase
APP_ENV=swiftcpq-env
MAIN_APP=swiftcpq
TEMPLATER_APP=swiftcpq-templater
PG_SERVER=swiftcpq-pg
PG_USER=swiftcpqadmin
PG_PASS=YourStrongPasswordHere  # change this
PG_DB=swiftcpq
```

---

## Step 1 - Resource Group

```bash
az group create --name $RESOURCE_GROUP --location $LOCATION
```

---

## Step 2 - Azure Container Registry

```bash
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

Log Docker into ACR:

```bash
az acr login --name $ACR_NAME
```

---

## Step 3 - Build and Push Images

From the repo root:

```bash
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)

# Main app (Express + Vue)
docker build -t $ACR_LOGIN_SERVER/swiftcpq:latest .
docker push $ACR_LOGIN_SERVER/swiftcpq:latest

# Templater
docker build -t $ACR_LOGIN_SERVER/swiftcpq-templater:latest ./templater
docker push $ACR_LOGIN_SERVER/swiftcpq-templater:latest
```

---

## Step 4 - PostgreSQL Flexible Server

```bash
az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $PG_SERVER \
  --location $LOCATION \
  --admin-user $PG_USER \
  --admin-password $PG_PASS \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15 \
  --public-access 0.0.0.0   # allows Azure services; tighten after setup
```

Create the database:

```bash
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $PG_SERVER \
  --database-name $PG_DB
```

Build the connection string:

```bash
DATABASE_URL="postgres://${PG_USER}:${PG_PASS}@${PG_SERVER}.postgres.database.azure.com:5432/${PG_DB}?sslmode=require"
```

---

## Step 5 - Container Apps Environment

```bash
az containerapp env create \
  --name $APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

---

## Step 6 - Deploy the Templater (internal only)

The templater has no public ingress - only the main app calls it over the private Container Apps network.

```bash
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)
INTERNAL_TOKEN=replace-with-random-secret   # must match main app

az containerapp create \
  --name $TEMPLATER_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $APP_ENV \
  --image $ACR_LOGIN_SERVER/swiftcpq-templater:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_NAME \
  --registry-password $ACR_PASSWORD \
  --ingress internal \
  --target-port 5005 \
  --env-vars \
      NODE_ENV=production \
      MAIN_SERVER_URL=http://swiftcpq \
      INTERNAL_SERVICE_TOKEN=$INTERNAL_TOKEN \
  --min-replicas 1 \
  --max-replicas 1
```

Retrieve the internal FQDN for use in the main app:

```bash
TEMPLATER_FQDN=$(az containerapp show \
  --name $TEMPLATER_APP \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn -o tsv)
```

---

## Step 7 - Deploy the Main App (public)

```bash
JWT_SECRET=replace-with-64-char-random-string
JWT_REFRESH_SECRET=replace-with-another-64-char-string
YOUR_DOMAIN=swiftcpq.yourdomain.com   # update after first deploy if using a custom domain

az containerapp create \
  --name $MAIN_APP \
  --resource-group $RESOURCE_GROUP \
  --environment $APP_ENV \
  --image $ACR_LOGIN_SERVER/swiftcpq:latest \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_NAME \
  --registry-password $ACR_PASSWORD \
  --ingress external \
  --target-port 5000 \
  --env-vars \
      NODE_ENV=production \
      DATABASE_URL="$DATABASE_URL" \
      JWT_SECRET=$JWT_SECRET \
      JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET \
      CORS_ORIGIN=https://$YOUR_DOMAIN \
      INTERNAL_SERVICE_TOKEN=$INTERNAL_TOKEN \
      TEMPLATER_URL=https://$TEMPLATER_FQDN \
  --min-replicas 1 \
  --max-replicas 3
```

Get the public URL:

```bash
az containerapp show \
  --name $MAIN_APP \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn -o tsv
```

Azure Container Apps provides a free `*.azurecontainerapps.io` URL. To use a custom domain, follow the [custom domain docs](https://learn.microsoft.com/en-us/azure/container-apps/custom-domains-certificates).

---

## Step 8 - Run Migrations

Run migrations once against the Azure database (and again after each release):

```bash
az containerapp exec \
  --name $MAIN_APP \
  --resource-group $RESOURCE_GROUP \
  --command "npm run migrate:up"
```

Seed initial data (first deploy only):

```bash
az containerapp exec \
  --name $MAIN_APP \
  --resource-group $RESOURCE_GROUP \
  --command "npm run seed"
```

---

## Step 9 - Microsoft Entra ID (optional)

Since the app is already running on Azure infrastructure, Entra login is straightforward to add.

1. Go to [Azure Portal](https://portal.azure.com) → Entra ID → App registrations → New registration
2. Set the redirect URI to `https://<your-app-fqdn>/api/v1/auth/entra/callback`
3. Create a client secret under **Certificates & secrets**
4. Update the main app's environment variables:

```bash
az containerapp update \
  --name $MAIN_APP \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
      ENTRA_CLIENT_ID=your-client-id \
      ENTRA_CLIENT_SECRET=your-client-secret \
      ENTRA_TENANT_ID=your-tenant-id \
      ENTRA_REDIRECT_URI=https://<your-app-fqdn>/api/v1/auth/entra/callback
```

When `ENTRA_CLIENT_ID` is set, the login page will show a "Sign in with Microsoft" button.

---

## Updating to a New Release

```bash
# Rebuild and push updated images
docker build -t $ACR_LOGIN_SERVER/swiftcpq:latest . && docker push $ACR_LOGIN_SERVER/swiftcpq:latest
docker build -t $ACR_LOGIN_SERVER/swiftcpq-templater:latest ./templater && docker push $ACR_LOGIN_SERVER/swiftcpq-templater:latest

# Redeploy (pulls the new image)
az containerapp update --name $MAIN_APP --resource-group $RESOURCE_GROUP --image $ACR_LOGIN_SERVER/swiftcpq:latest
az containerapp update --name $TEMPLATER_APP --resource-group $RESOURCE_GROUP --image $ACR_LOGIN_SERVER/swiftcpq-templater:latest

# Run any new migrations
az containerapp exec --name $MAIN_APP --resource-group $RESOURCE_GROUP --command "npm run migrate:up"
```
