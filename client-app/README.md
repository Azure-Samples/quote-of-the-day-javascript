# Quote of the Day

A react application showing how to load a **variant feature flag**  from **Azure App Configuration** via **Azure Front Door** and use it to experiment with a personalized greeting in a classic Quote of the Day UI.

## Prerequisites
* Node.js 18+
* Azure Front Door endpoint configured with Azure App Configuration as its origin.
* Application Insights resource

## Get Started

- Replace the placeholders in `src/config.js`:
    ```js
    // Application Insights connection string (Instrumentation for telemetry)
    appInsightsConnectionString: "YOUR-APP-INSIGHTS-CONNECTION-STRING",
    // Azure Front Door endpoint hosting App Configuration data (feature flags, etc.)
    azureFrontDoorEndpoint: "YOUR-AZURE-FRONT-DOOR-ENDPOINT"
    ```

- Create a variant feature flag named `Greeting` in your App Configuration store with the below configuration:

    ```json
    {
        "id": "Greeting",
        "enabled": true,
        "variants": [
            {
                "name": "Off",
                "configuration_value": false
            },
            {
                "name": "On",
                "configuration_value": true
            }
        ],
        "allocation": {
            "percentile": [
                {
                    "variant": "Off",
                    "from": 0,
                    "to": 50
                },
                {
                    "variant": "On",
                    "from": 50,
                    "to": 100
                }
            ],
            "user": [
                {
                    "variant": "On",
                    "users": [
                        "admin"
                    ]
                }
            ],
            "default_when_enabled": "Off",
            "default_when_disabled": "Off"
        },
        "telemetry": {
            "enabled": true
        }
    }
    ```
- Run the following command:

    ```powershell
    cd client-app
    npm install
    npm run build
    npm run preview
    ```

