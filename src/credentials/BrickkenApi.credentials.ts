import type {
  IAuthenticateGeneric,
  Icon,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class BrickkenApi implements ICredentialType {
  name = 'brickkenApi';

  displayName = 'Brickken API';

  icon: Icon = 'file:brickkenApiV2.svg';

  documentationUrl = 'https://docs.brickken.com';

  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Brickken API key to authenticate requests',
    },
    {
      displayName: 'Environment',
      name: 'environment',
      type: 'options',
      options: [
        { name: 'Sandbox', value: 'sandbox' },
        { name: 'Production', value: 'production' },
      ],
      default: 'sandbox',
      description: 'Choose which Brickken API environment to use',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        // Pass API key in required header
        'x-api-key': '={{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL:
        '={{$credentials.environment === "production" ? "https://api.brickken.com" : "https://api-sandbox.brickken.com"}}',
      url: '/get-network-info',
      method: 'GET',
    },
  };
}