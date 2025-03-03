// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const appConfigEndpoint = process.env.APPCONFIG_ENDPOINT;
const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

const applicationInsights = require("applicationinsights");
applicationInsights.setup(appInsightsConnectionString).start();

const express = require("express");
const server = express();

const { DefaultAzureCredential } = require("@azure/identity");
const { load } = require("@azure/app-configuration-provider");
const { FeatureManager, ConfigurationMapFeatureFlagProvider } = require("@microsoft/feature-management");
const { createTelemetryPublisher, trackEvent } = require("@microsoft/feature-management-applicationinsights-node");
let appConfig;
let featureManager;
async function initializeConfig() {
    console.log("Loading configuration...");
    appConfig = await load(appConfigEndpoint, new DefaultAzureCredential(), {
        featureFlagOptions: {
            enabled: true,
            selectors: [
                {
                    keyFilter: "*"
                }
            ],
            refresh: {
                enabled: true,
                refreshIntervalInMs: 10_000
            }
        }
    });

    const featureFlagProvider = new ConfigurationMapFeatureFlagProvider(appConfig);
    const publishTelemetry = createTelemetryPublisher(appInsights.defaultClient);
    featureManager = new FeatureManager(featureFlagProvider, {
        onFeatureEvaluated: publishTelemetry
    });
}

// Initialize the configuration and start the server
initializeConfig()
    .then(() => {
        console.log("Configuration loaded. Starting server...");
        startServer();
    })
    .catch((error) => {
        console.error("Failed to load configuration:", error);
        process.exit(1);
    });

function startServer() {
    // Use a middleware to refresh the configuration before each request
    // The configuration refresh is triggered by the incoming requests to your web app. No refresh will occur if your app is idle.
    server.use((req, res, next) => {
        // The configuration refresh happens asynchronously to the processing of your app's incoming requests.
        // It will not block or slow down the incoming request that triggered the refresh. 
        // The request that triggered the refresh may not get the updated configuration values, but later requests will get new configuration values.
        appConfig.refresh(); // intended to not await the refresh
        next();
    });
    server.use(express.json());
    server.use(express.static("public"));

    server.get("/api/getGreetingMessage", async (req, res) => {
        const { userId, groups } = req.query;
        const variant = await featureManager.getVariant("Greeting", { userId: userId, groups: groups ? groups.split(",") : [] });
        res.status(200).send({
            message: variant?.configuration
        });
    });

    server.post("/api/like", (req, res) => {
        const { UserId } = req.body;
        if (UserId === undefined) {
            return res.status(400).send({ error: "UserId is required" });
        }
        trackEvent(applicationInsights.defaultClient, UserId, { name: "Like" });
        res.status(200).send({ message: "Like event logged successfully" });
    });

    const port = process.env.PORT || "8080";
    server.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}
