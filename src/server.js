// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const appConfigConnectionString = process.env.APPCONFIG_CONNECTION_STRING;
const appInsightsConnectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

const applicationInsights = require("applicationinsights");
applicationInsights.setup(appInsightsConnectionString).start();

const express = require("express");
const app = express();

const { load } = require("@azure/app-configuration-provider");
const { FeatureManager, ConfigurationMapFeatureFlagProvider } = require("@microsoft/feature-management");
const { createTelemetryPublisher, trackEvent } = require("@microsoft/feature-management-applicationinsights-node");
let appConfig;
let featureManager;
async function initializeConfig() {
    console.log("Loading configuration...");
    appConfig = await load(appConfigConnectionString, {
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

    featureManager = new FeatureManager(
        new ConfigurationMapFeatureFlagProvider(appConfig),
        { onFeatureEvaluated: createTelemetryPublisher(applicationInsights.defaultClient) }
    );
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
    app.use(express.json());
    app.use(express.static("public"));
    app.use((req, res, next) => { console.log("YES"); next(); });

    app.get("/api/config", (req, res) => {
        res.json(appConfig.constructConfigurationObject());

        refreshConfig();
    });

    app.get("/api/getGreetingMessage", async (req, res) => {
        const { userId, groups } = req.query;
        if (userId === undefined && groups === undefined) {
            return res.status(400).send({ error: "userId and groups are required" });
        }
        const variant = await featureManager.getVariant("Greeting", { userId: userId, groups: groups ? groups.split(",") : []});
        res.status(200).send({
            message: variant?.configuration
        });

        refreshConfig();
    });

    app.post("/api/like", (req, res) => {
        const { UserId } = req.body;
        if (UserId === undefined) {
            return res.status(400).send({ error: "UserId is required" });
        }
        trackEvent(applicationInsights.defaultClient, UserId, { name: "Like" });
        res.status(200).send({ message: "Like event logged successfully" });

        refreshConfig();
    });

    const port = process.env.PORT || "8080";
    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });
}

function refreshConfig() {
    appConfig.refresh()
        .then((res) => {console.log("Config refresh triggered.")})
        .catch((error) => {
            console.error("Failed to refresh config:", error);
        });
}
