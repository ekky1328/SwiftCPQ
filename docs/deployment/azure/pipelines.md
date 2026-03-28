# CI/CD Pipelines - Azure Deployment

Both pipelines follow the same steps:
1. Build Docker images tagged with the commit SHA
2. Push to Azure Container Registry
3. Update both Container Apps to the new image
4. Run database migrations

---

## Recommended: Use Azure Key Vault for Pipeline Secrets

Both pipelines need access to secrets (JWT secrets, DB passwords, etc.) at deploy time. Rather than storing these directly in GitHub Secrets or Azure DevOps variable groups, it is recommended to store them in **Azure Key Vault** and have the pipeline pull them at runtime. This gives you a single source of truth, full audit logging, and easy rotation without updating every pipeline.

### GitHub Actions — Key Vault integration

After logging in to Azure via OIDC, use the `azure/get-keyvault-secrets` action to pull secrets into the pipeline environment:

```yaml
- name: Login to Azure (OIDC)
  uses: azure/login@v2
  with:
    client-id: ${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: ${{ secrets.AZURE_TENANT_ID }}
    subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

- name: Pull secrets from Key Vault
  uses: azure/get-keyvault-secrets@v1
  with:
    keyvault: swiftcpq-kv
    secrets: 'jwt-secret, jwt-refresh-secret, internal-service-token'
  id: kv
# Secrets are now available as: ${{ steps.kv.outputs.jwt-secret }}
```

Grant the service principal **Key Vault Secrets User** on the vault:

```bash
az role assignment create \
  --assignee <sp-client-id> \
  --role "Key Vault Secrets User" \
  --scope $(az keyvault show --name swiftcpq-kv --query id -o tsv)
```

You still need `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` in GitHub Secrets — but these are non-sensitive identifiers, not passwords.

### Azure DevOps — Key Vault linked variable group

Azure DevOps has native Key Vault integration via **Library → Variable groups**. Secrets are fetched fresh from Key Vault on every pipeline run.

1. Go to **Pipelines → Library → + Variable group**
2. Enable **Link secrets from an Azure key vault as variables**
3. Select your Azure subscription and `swiftcpq-kv`
4. Add the secrets you want available: `jwt-secret`, `jwt-refresh-secret`, `internal-service-token`, etc.
5. Name the group `swiftcpq-secrets`

Reference the group in your pipeline:

```yaml
variables:
  - group: swiftcpq-secrets   # secrets from Key Vault
  - group: swiftcpq-azure     # non-secret config (resource group, app names, etc.)
```

The Key Vault secrets are then available as pipeline variables (e.g. `$(jwt-secret)`) and are automatically masked in logs.

---

## GitHub Actions

### Prerequisites

**Azure service principal with OIDC federation** (no stored passwords):

```bash
# Create a service principal
az ad sp create-for-rbac --name swiftcpq-github-actions --sdk-auth

# Assign Contributor on the resource group
az role assignment create \
  --assignee <sp-client-id> \
  --role Contributor \
  --scope /subscriptions/<sub-id>/resourceGroups/swiftcpq-rg

# Also grant AcrPush on the registry
az role assignment create \
  --assignee <sp-client-id> \
  --role AcrPush \
  --scope $(az acr show --name swiftcpqregistry --query id -o tsv)
```

Then in your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret | Value |
|--------|-------|
| `AZURE_CLIENT_ID` | Service principal client ID |
| `AZURE_TENANT_ID` | Your Azure tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Your subscription ID |

Add a **federated credential** on the service principal so GitHub can authenticate without a stored secret:

```bash
az ad app federated-credential create \
  --id <sp-app-id> \
  --parameters '{
    "name": "swiftcpq-github",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:YOUR_ORG/SwiftCPQ:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

---

### .github/workflows/deploy-azure.yml

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

permissions:
  id-token: write   # required for OIDC
  contents: read

env:
  RESOURCE_GROUP: swiftcpq-rg
  ACR_NAME: swiftcpqregistry
  MAIN_APP: swiftcpq
  TEMPLATER_APP: swiftcpq-templater

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Login to Azure (OIDC)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Get ACR login server
        run: |
          ACR_SERVER=$(az acr show --name $ACR_NAME --query loginServer -o tsv)
          echo "ACR_SERVER=$ACR_SERVER" >> $GITHUB_ENV

      - name: Login to ACR
        run: az acr login --name $ACR_NAME

      - name: Build and push main app
        run: |
          docker build -t $ACR_SERVER/swiftcpq:${{ github.sha }} -t $ACR_SERVER/swiftcpq:latest .
          docker push $ACR_SERVER/swiftcpq:${{ github.sha }}
          docker push $ACR_SERVER/swiftcpq:latest

      - name: Build and push templater
        run: |
          docker build -t $ACR_SERVER/swiftcpq-templater:${{ github.sha }} -t $ACR_SERVER/swiftcpq-templater:latest ./templater
          docker push $ACR_SERVER/swiftcpq-templater:${{ github.sha }}
          docker push $ACR_SERVER/swiftcpq-templater:latest

      - name: Deploy main app
        run: |
          az containerapp update \
            --name $MAIN_APP \
            --resource-group $RESOURCE_GROUP \
            --image $ACR_SERVER/swiftcpq:${{ github.sha }}

      - name: Deploy templater
        run: |
          az containerapp update \
            --name $TEMPLATER_APP \
            --resource-group $RESOURCE_GROUP \
            --image $ACR_SERVER/swiftcpq-templater:${{ github.sha }}

      - name: Run migrations
        run: |
          az containerapp exec \
            --name $MAIN_APP \
            --resource-group $RESOURCE_GROUP \
            --command "npm run migrate:up"
```

> Images are tagged with both the commit SHA (immutable, for rollback) and `latest` (for convenience).

---

## Azure DevOps

### Prerequisites

In your Azure DevOps project:

1. **Azure service connection** - Project Settings → Service connections → New → Azure Resource Manager
   Name it `SwiftCPQ-Azure`. Grant it Contributor on the resource group.

2. **Docker Registry service connection** - Project Settings → Service connections → New → Docker Registry → Azure Container Registry
   Name it `SwiftCPQ-ACR`. Select your registry.

3. **Variable group** (optional but recommended) - Pipelines → Library → New variable group named `swiftcpq-azure`.
   Add `RESOURCE_GROUP`, `ACR_NAME`, `MAIN_APP`, `TEMPLATER_APP` as variables.
   Link it to the pipeline under `variables.group`.

---

### azure-pipelines.yml

```yaml
trigger:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

variables:
  - group: swiftcpq-azure   # variable group from Library (optional)
  # Fallback values if not using a variable group:
  - name: RESOURCE_GROUP
    value: swiftcpq-rg
  - name: ACR_NAME
    value: swiftcpqregistry
  - name: MAIN_APP
    value: swiftcpq
  - name: TEMPLATER_APP
    value: swiftcpq-templater
  - name: IMAGE_TAG
    value: $(Build.BuildId)

stages:
  - stage: Build
    displayName: Build and push images
    jobs:
      - job: BuildImages
        steps:
          - task: Docker@2
            displayName: Build and push main app
            inputs:
              containerRegistry: SwiftCPQ-ACR
              repository: swiftcpq
              command: buildAndPush
              Dockerfile: .docker/Dockerfile
              buildContext: .
              tags: |
                $(IMAGE_TAG)
                latest

          - task: Docker@2
            displayName: Build and push worker
            inputs:
              containerRegistry: SwiftCPQ-ACR
              repository: swiftcpq-worker
              command: buildAndPush
              Dockerfile: .docker/Dockerfile.worker
              buildContext: .
              tags: |
                $(IMAGE_TAG)
                latest

          - task: Docker@2
            displayName: Build and push templater
            inputs:
              containerRegistry: SwiftCPQ-ACR
              repository: swiftcpq-templater
              command: buildAndPush
              Dockerfile: .docker/Dockerfile.templater
              buildContext: .
              tags: |
                $(IMAGE_TAG)
                latest

  - stage: Deploy
    displayName: Deploy to Azure
    dependsOn: Build
    jobs:
      - deployment: DeployContainerApps
        displayName: Update Container Apps and migrate
        environment: production
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureCLI@2
                  displayName: Get ACR login server
                  inputs:
                    azureSubscription: SwiftCPQ-Azure
                    scriptType: bash
                    scriptLocation: inlineScript
                    inlineScript: |
                      ACR_SERVER=$(az acr show --name $(ACR_NAME) --query loginServer -o tsv)
                      echo "##vso[task.setvariable variable=ACR_SERVER;isOutput=true]$ACR_SERVER"
                  name: getAcr

                - task: AzureCLI@2
                  displayName: Deploy main app
                  inputs:
                    azureSubscription: SwiftCPQ-Azure
                    scriptType: bash
                    scriptLocation: inlineScript
                    inlineScript: |
                      az containerapp update \
                        --name $(MAIN_APP) \
                        --resource-group $(RESOURCE_GROUP) \
                        --image $(getAcr.ACR_SERVER)/swiftcpq:$(IMAGE_TAG)

                - task: AzureCLI@2
                  displayName: Deploy templater
                  inputs:
                    azureSubscription: SwiftCPQ-Azure
                    scriptType: bash
                    scriptLocation: inlineScript
                    inlineScript: |
                      az containerapp update \
                        --name $(TEMPLATER_APP) \
                        --resource-group $(RESOURCE_GROUP) \
                        --image $(getAcr.ACR_SERVER)/swiftcpq-templater:$(IMAGE_TAG)

                - task: AzureCLI@2
                  displayName: Run database migrations
                  inputs:
                    azureSubscription: SwiftCPQ-Azure
                    scriptType: bash
                    scriptLocation: inlineScript
                    inlineScript: |
                      az containerapp exec \
                        --name $(MAIN_APP) \
                        --resource-group $(RESOURCE_GROUP) \
                        --command "npm run migrate:up"
```

> The `deployment` job type (rather than plain `job`) tracks deployments against an **environment**, giving you a deployment history and the ability to add approval gates in Azure DevOps before the deploy stage runs.

---

## Rollback

Both pipelines tag images with the build ID / commit SHA. To roll back to a previous image:

**GitHub Actions:**
```bash
az containerapp update \
  --name swiftcpq \
  --resource-group swiftcpq-rg \
  --image <acr-server>/swiftcpq:<previous-sha>
```

**Azure DevOps:** Use the Container Apps revision management in the portal, or re-run a previous pipeline build and promote its image tag.
