"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrickkenApi = void 0;
class BrickkenApi {
    constructor() {
        this.name = "brickkenApi";
        this.displayName = "Brickken API";
        this.icon = "file:brickkenApiV2.svg";
        this.documentationUrl = "https://docs.brickken.com";
        this.properties = [
            {
                displayName: "API Key",
                name: "apiKey",
                type: "string",
                typeOptions: { password: true },
                default: "",
                required: true,
                description: "Brickken API key to authenticate requests"
            },
            {
                displayName: "Environment",
                name: "environment",
                type: "options",
                options: [
                    { name: "Sandbox", value: "sandbox" },
                    { name: "Production", value: "production" }
                ],
                default: "sandbox",
                description: "Choose which Brickken API environment to use"
            }
        ];
        this.authenticate = {
            type: "generic",
            properties: {
                headers: {
                    // Pass API key in required header
                    "x-api-key": "={{$credentials.apiKey}}"
                }
            }
        };
        this.test = {
            request: {
                baseURL: '={{$credentials.environment === "production" ? "https://api.brickken.com" : "https://api-sandbox.brickken.com"}}',
                url: "/get-network-info",
                method: "GET"
            }
        };
    }
}
exports.BrickkenApi = BrickkenApi;
//# sourceMappingURL=BrickkenApi.credentials.js.map