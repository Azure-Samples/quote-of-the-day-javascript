// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const appInsightsConnectionString = "YOUR-APP-INSIGHTS-CONNECTION-STRING";

import { createContext, useState, useEffect } from "react";
import { loadFromAzureFrontDoor } from "@azure/app-configuration-provider";
import { FeatureManager, ConfigurationMapFeatureFlagProvider } from "@microsoft/feature-management";
import { createTelemetryPublisher } from "@microsoft/feature-management-applicationinsights-browser";
import { ApplicationInsights } from "@microsoft/applicationinsights-web";

export const AppContext = createContext();

export const ContextProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(undefined);
  const [featureManager, setFeatureManager] = useState(undefined);
  const appInsights = new ApplicationInsights({ config: {
    connectionString: appInsightsConnectionString,
  }});
  appInsights.loadAppInsights();

  useEffect(() => {
    const init = async () => {
      const appConfig = await loadFromAzureFrontDoor(
        "YOUR-AZURE-FRONT-DOOR-ENDPOINT",
        {
          featureFlagOptions: {
            enabled: true
          }
        }
      );
  
      const fm = new FeatureManager(
        new ConfigurationMapFeatureFlagProvider(appConfig),
        {onFeatureEvaluated: createTelemetryPublisher(appInsights)}
      );
      setFeatureManager(fm);
    };

    init();
  }, []);

  const loginUser = (user) => {
    setCurrentUser(user);
  };

  const logoutUser = () => {
    setCurrentUser(undefined);
  };

  return (
    <AppContext.Provider value={{ appInsights, featureManager, currentUser, loginUser, logoutUser }}>
      {children}
    </AppContext.Provider>
  );
};
