param name string
param location string = resourceGroup().location
param tags object = {}

param appConfigurationName string
param applicationInsightsName string
@secure()
param appDefinition object
param appServicePlanId string

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: applicationInsightsName
}

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: name
  location: location
  tags: union(tags, {'azd-service-name':  'QuoteOfTheDay' })
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    siteConfig: {
      appCommandLine: 'npm install && npm start'
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
    }
  }
}

@description('This is the built-in app configuration data reader role. See https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#app-configuration-data-reader')
resource appConfigDataReaderDefinition 'Microsoft.Authorization/roleDefinitions@2022-04-01' existing = {
  name: '516239f1-63e1-4d78-a4de-a74fb236a071'
}

resource appConfiguration 'Microsoft.AppConfiguration/configurationStores@2023-09-01-preview' existing = {
  name: appConfigurationName
}

resource appConfigDataReaderRoleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, appConfiguration.id, appConfigDataReaderDefinition.id)
  scope: appConfiguration
  properties: {
    roleDefinitionId: appConfigDataReaderDefinition.id
    principalId: appService.identity.principalId
    principalType: 'ServicePrincipal' 
  }
}

module configAppSettings '../shared/appservice-appsettings.bicep' = {
  name: '${name}-appSettings'
  params: {
    name: appService.name
    appSettings: union(
      {
        ENABLE_ORYX_BUILD: false
      },
      {
        SCM_DO_BUILD_DURING_DEPLOYMENT: false
      },
      {
        APPLICATIONINSIGHTS_CONNECTION_STRING: applicationInsights.properties.ConnectionString
      },
      {
        APPCONFIG_ENDPOINT: appConfiguration.properties.endpoint
      },
      appDefinition.settings)
  }
}

output name string = appService.name
output uri string = 'https://${appService.properties.defaultHostName}'
