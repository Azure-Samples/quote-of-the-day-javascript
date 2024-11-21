param name string
param location string = resourceGroup().location
param tags object = {}

param identityName string
param applicationInsightsName string
@secure()
param appDefinition object
param appConfigurationConnectionString string
param appServicePlanId string

resource identity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: identityName
  location: location
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: applicationInsightsName
}

resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: name
  location: location
  tags: union(tags, {'azd-service-name':  'QuoteOfTheDay' })
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${identity.id}': {} }
  }
  properties: {
    serverFarmId: appServicePlanId
    siteConfig: {
      appCommandLine: 'npm start'
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
    }
  }
}

module configAppSettings '../shared/appservice-appsettings.bicep' = {
  name: '${name}-appSettings'
  params: {
    name: appService.name
    appSettings: union(
      {
        ENABLE_ORYX_BUILD: true
      },
      {
        SCM_DO_BUILD_DURING_DEPLOYMENT: true
      },
      {
        APPLICATIONINSIGHTS_CONNECTION_STRING: applicationInsights.properties.ConnectionString
      },
      {
        APPCONFIG_CONNECTION_STRING: appConfigurationConnectionString
      },
      appDefinition.settings)
  }
}

output name string = appService.name
output uri string = 'https://${appService.properties.defaultHostName}'