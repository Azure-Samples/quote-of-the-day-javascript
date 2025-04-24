// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

module.exports = {
    appConfigEndpoint: process.env.APPCONFIG_ENDPOINT,
    appInsightsConnectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
    port: process.env.PORT || "8080"
};
