// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.


const { DefaultAzureCredential } = require("@azure/identity");
const { load } = require("@azure/app-configuration-provider");
const { FeatureManager, ConfigurationMapFeatureFlagProvider } = require("@microsoft/feature-management");
const { createTelemetryPublisher } = require("@microsoft/feature-management-applicationinsights-node");
const config = require("./config");

// Variables to hold the App Configuration provider and feature manager instances
let appConfig;
let featureManager;

// Initialize App Configuration provider and feature management
async function initializeFeatureManagement(appInsightsClient, targetingContextAccessor) {
    console.log("Loading feature flags from Azure App Configuration...");
    appConfig = await load(config.appConfigEndpoint, new DefaultAzureCredential(), {
        featureFlagOptions: {
            enabled: true,
            refresh: {
                enabled: true
            }
        }
    });
    const featureFlagProvider = new ConfigurationMapFeatureFlagProvider(appConfig);

    const publishTelemetry = createTelemetryPublisher(appInsightsClient);
    featureManager = new FeatureManager(featureFlagProvider, {
        onFeatureEvaluated: publishTelemetry,
        targetingContextAccessor: targetingContextAccessor
    });

    return { featureManager, appConfig };
}

// Middleware to refresh configuration before each request
const featureFlagRefreshMiddleware = (req, res, next) => {
    // The configuration refresh happens asynchronously to the processing of your app's incoming requests.
    // It will not block or slow down the incoming request that triggered the refresh. 
    // The request that triggered the refresh may not get the updated configuration values, but later requests will get new configuration values.
    appConfig?.refresh(); // intended to not await the refresh
    next();
};

module.exports = {
    initializeFeatureManagement,
    featureFlagRefreshMiddleware
};