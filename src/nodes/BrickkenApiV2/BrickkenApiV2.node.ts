import type {
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class BrickkenApiV2 implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Brickken API',
    name: 'brickkenApi',
    icon: 'file:brickkenApiV2.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Brickken API for tokenization and blockchain operations',
    defaults: {
      name: 'Brickken API',
    },
    inputs: ['main'],
    outputs: ['main'],
    usableAsTool: true,
    credentials: [
      {
        name: 'brickkenApi',
        required: true,
      },
    ],
    requestDefaults: {
      baseURL:
        '={{$credentials.environment === "production" ? "https://api.brickken.com" : "https://api.sandbox.brickken.com"}}',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    properties: [
      // Resource selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          { name: 'Transaction', value: 'transactions' },
          { name: 'Info', value: 'info' },
        ],
        default: 'transactions',
      },

      // Operations for Transactions
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['transactions'] } },
        options: [
          {
            name: 'Prepare Transactions',
            value: 'prepareTransactions',
            action: 'Prepare unsigned transactions',
            description: 'POST /prepare-transactions',
            routing: {
              request: { method: 'POST', url: '/prepare-transactions' },
            },
          },
          {
            name: 'Send Transactions',
            value: 'sendTransactions',
            action: 'Send signed transactions',
            description: 'POST /send-transactions',
            routing: {
              request: { method: 'POST', url: '/send-transactions' },
            },
          },
          {
            name: 'Patch Token Docs',
            value: 'patchTokenDocs',
            action: 'Update token documents',
            description: 'Update token documents and logotype',
            routing: {
              request: {
                method: 'PATCH',
                url: '/patch-token-docs',
                headers: {
                  'Content-Type': 'multipart/form-data',
                },
              },
            },
          },
        ],
        default: 'prepareTransactions',
      },

      // Common parameters
      {
        displayName: 'Chain ID',
        name: 'chainId',
        type: 'options',
        options: [
          { name: 'Ethereum Mainnet', value: '1' },
          { name: 'Base Mainnet', value: '2105' },
          { name: 'BNB Smart Chain Mainnet', value: '38' },
          { name: 'Polygon Mainnet', value: '89' },
          { name: 'Sepolia Testnet', value: 'aa36a7' },
          { name: 'Polygon Amoy Testnet', value: '13882' },
          { name: 'Custom', value: 'custom' },
        ],
        default: 'aa36a7',
        required: true,
        description: 'Blockchain network to use. Production networks: Ethereum (1), Base (2105), BNB (38), Polygon (89). Sandbox networks: Sepolia (aa36a7), Polygon Amoy (13882)',
        routing: {
          send: { type: 'body', property: 'chainId' },
        },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'] },
        },
      },
      {
        displayName: 'Custom Chain ID',
        name: 'customChainId',
        type: 'string',
        default: '',
        required: true,
        description: 'Enter custom chain ID (hex or decimal string)',
        routing: {
          send: { type: 'body', property: 'chainId' },
        },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'], chainId: ['custom'] },
        },
      },
      {
        displayName: 'Method',
        name: 'method',
        type: 'options',
        options: [
          { name: 'Approve', value: 'approve' },
          { name: 'burnToken', value: 'burnToken' },
          { name: 'claimTokens', value: 'claimTokens' },
          { name: 'closeOffer', value: 'closeOffer' },
          { name: 'dividendDistribution', value: 'dividendDistribution' },
          { name: 'mintToken', value: 'mintToken' },
          { name: 'newInvest', value: 'newInvest' },
          { name: 'newSto', value: 'newSto' },
          { name: 'newTokenization', value: 'newTokenization' },
          { name: 'transferFrom', value: 'transferFrom' },
          { name: 'transferTo', value: 'transferTo' },
          { name: 'Whitelist', value: 'whitelist' },
        ],
        default: 'newTokenization',
        description: 'Transaction method to prepare',
        routing: {
          send: { type: 'body', property: 'method' },
        },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'] },
        },
      },

      // Method for paymentTokenSymbol
      {
        displayName: 'Payment Token Symbol',
        name: 'paymentTokenSymbol',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        routing: { send: { type: 'body', property: 'paymentTokenSymbol' } },
        displayOptions: {
          show: {
            resource: ['transactions'],
            operation: ['prepareTransactions'],
            method: ['claimTokens', 'newInvest'],
          },
        },
      },

      // Method-specific parameters (conditionally shown)
      {
        displayName: 'Signer Address',
        name: 'signerAddress',
        type: 'string',
        default: '',
        description: 'EOA address of the transaction signer',
        routing: { send: { type: 'body', property: 'signerAddress' } },
        displayOptions: {
          show: {
            resource: ['transactions'],
            operation: ['prepareTransactions'],
            method: [
              'newTokenization',
              'newSto',
              'closeOffer',
              'mintToken',
              'whitelist',
              'burnToken',
              'transferFrom',
              'transferTo',
              'approve',
              'dividendDistribution',
            ],
          },
        },
      },
      {
        displayName: 'Investor Address',
        name: 'investorAddress',
        type: 'string',
        default: '',
        description: 'Investor wallet address (for investment/claim actions)',
        routing: { send: { type: 'body', property: 'investorAddress' } },
        displayOptions: {
          show: {
            resource: ['transactions'],
            operation: ['prepareTransactions'],
            method: ['newInvest', 'claimTokens'],
          },
        },
      },
      {
        displayName: 'Token Symbol',
        name: 'tokenSymbol',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        description: 'Symbol of the token',
        routing: { send: { type: 'body', property: 'tokenSymbol' } },
        displayOptions: {
          show: {
            resource: ['transactions'],
            operation: ['prepareTransactions'],
            method: [
              'newTokenization',
              'newSto',
              'newInvest',
              'claimTokens',
              'closeOffer',
              'mintToken',
              'whitelist',
              'burnToken',
              'transferFrom',
              'transferTo',
              'approve',
              'dividendDistribution',
            ],
          },
        },
      },
      {
        displayName: 'Tokenizer Email',
        name: 'tokenizerEmail',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        description: 'Email address of the tokenizer creating the asset',
        routing: { send: { type: 'body', property: 'tokenizerEmail' } },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newTokenization', 'newSto', 'approve', 'closeOffer'] },
        },
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        description: 'URL to documentation or legal documents associated with the tokenization',
        routing: { send: { type: 'body', property: 'url' } },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newTokenization'] },
        },
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        required: true,
        description: 'Full name of the token (e.g., "Real Estate Property Token")',
        routing: { send: { type: 'body', property: 'name' } },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newTokenization'] },
        },
      },
      {
        displayName: 'Supply Cap',
        name: 'supplyCap',
        type: 'string',
        default: '0',
        description: 'Maximum number of tokens that can be minted (leave empty for unlimited supply)',
        routing: { send: { type: 'body', property: 'supplyCap' } },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newTokenization'] },
        },
      },
      {
        displayName: 'Token Type',
        name: 'tokenType',
        type: 'options',
        options: [
          { name: 'DEBT', value: 'DEBT' },
          { name: 'EQUITY', value: 'EQUITY' },
          { name: 'FUNDS', value: 'REVENUE_SHARE' },
          { name: 'PRIVATE_CREDIT', value: 'BILL_FACTORING' },
          { name: 'PROFIT_SHARING', value: 'PROFIT_SHARING' },
          { name: 'RWA_TOKEN', value: 'RWA_TOKEN' },
        ],
        default: 'EQUITY',
        description: 'Type of the token',
        routing: { send: { type: 'body', property: 'tokenType' } },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newTokenization'] },
        },
      },
      {
        displayName: 'Accepted Coin',
        name: 'acceptedCoin',
        type: 'string',
        default: '',
        required: true,
        description: 'Accepted payment coin (e.g., USDT, USDC, or NATIVE for chain native coin)',
        routing: { send: { type: 'body', property: 'acceptedCoin' } },
        displayOptions: {
          show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] },
        },
      },
      {
        displayName: 'Token Amount',
        name: 'tokenAmount',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        description: 'Total number of tokens offered in the STO',
        routing: { send: { type: 'body', property: 'tokenAmount' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] } },
      },
      {
        displayName: 'Offering Name',
        name: 'offeringName',
        type: 'string',
        default: '',
        required: true,
        description: 'Name of the STO offering',
        routing: { send: { type: 'body', property: 'offeringName' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] } },
      },
      {
        displayName: 'Start Date',
        name: 'startDate',
        type: 'dateTime',
        default: '',
        routing: { send: { type: 'body', property: 'startDate' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] } },
      },
      {
        displayName: 'End Date',
        name: 'endDate',
        type: 'dateTime',
        default: '',
        routing: { send: { type: 'body', property: 'endDate' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] } },
      },
      {
        displayName: 'Min Raise (USD)',
        name: 'minRaiseUSD',
        type: 'string',
        default: '',
        routing: { send: { type: 'body', property: 'minRaiseUSD' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] } },
      },
      {
        displayName: 'Max Raise (USD)',
        name: 'maxRaiseUSD',
        type: 'string',
        default: '',
        routing: { send: { type: 'body', property: 'maxRaiseUSD' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] } },
      },
      {
        displayName: 'Min Investment',
        name: 'minInvestment',
        type: 'string',
        default: '',
        required: true,
        description: 'Minimum investment amount in payment token units',
        routing: { send: { type: 'body', property: 'minInvestment' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] } },
      },
      {
        displayName: 'Max Investment',
        name: 'maxInvestment',
        type: 'string',
        default: '',
        required: true,
        description: 'Maximum investment amount in payment token units',
        routing: { send: { type: 'body', property: 'maxInvestment' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newSto'] } },
      },
      {
        displayName: 'Investor Email',
        name: 'investorEmail',
        type: 'string',
        default: '',
        routing: { send: { type: 'body', property: 'investorEmail' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newInvest', 'claimTokens', 'burnToken', 'whitelist'] } },
      },
      {
        displayName: 'Amount',
        name: 'amount',
        type: 'string',
        default: '',
        routing: { send: { type: 'body', property: 'amount' } },
        displayOptions: {
          show: {
            resource: ['transactions'],
            operation: ['prepareTransactions'],
            method: ['newInvest', 'burnToken', 'transferFrom', 'transferTo', 'approve', 'dividendDistribution'],
          },
        },
      },
      {
        displayName: 'From',
        name: 'from',
        type: 'string',
        default: '',
        routing: { send: { type: 'body', property: 'from' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['transferFrom'] } },
      },
      {
        displayName: 'To',
        name: 'to',
        type: 'string',
        default: '',
        routing: { send: { type: 'body', property: 'to' } },
        displayOptions: {
          show: {
            resource: ['transactions'],
            operation: ['prepareTransactions'],
            method: ['transferFrom', 'transferTo'],
          },
        },
      },
      {
        displayName: 'Spender Address',
        name: 'spenderAddress',
        type: 'string',
        default: '',
        routing: { send: { type: 'body', property: 'spenderAddress' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['approve'] } },
      },
      {
        displayName: 'Tokenizer Address',
        name: 'tokenizerAddressApprove',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        description: 'Tokenizer address (required for approve in certain flows)',
        routing: { send: { type: 'body', property: 'tokenizerAddress' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['approve'] } },
      },
      // Fields for newTokenization method
      {
        displayName: 'Pre Mints',
        name: 'preMints',
        type: 'collection',
        typeOptions: { multipleValues: true, multipleValueButtonText: 'Add PreMint' },
        default: {},
        description: 'Pre-mint tokens to specific addresses during tokenization',
        options: [
          { displayName: 'Amount', name: 'amount', type: 'string', default: '0' },
        ],
        routing: {
          send: {
            type: 'body',
            property: 'preMints',
            value: '={{$value}}',
          },
        },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newTokenization'] } },
      },
      {
        displayName: 'Initial Holders',
        name: 'initialHolders',
        type: 'collection',
        typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Holder' },
        default: {},
        description: 'Define initial token holders with percentage allocations',
        options: [
          {
            displayName: 'Email', name: 'email', type: 'string',
            placeholder: 'name@email.com', default: ''
          },
          { displayName: 'Wallet Address', name: 'walletAddress', type: 'string', default: '' },
        ],
        routing: {
          send: {
            type: 'body',
            property: 'initialHolders',
            value: '={{$value}}',
          },
        },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['newTokenization'] } },
      },
      {
        displayName: 'Users To Mint',
        name: 'userToMint',
        type: 'collection',
        typeOptions: { multipleValues: true, multipleValueButtonText: 'Add User' },
        default: {},
        options: [
          { displayName: 'Amount', name: 'amount', type: 'string', default: '' },
          { displayName: 'Investor Address', name: 'investorAddress', type: 'string', default: '' },
          { displayName: 'Investor Email', name: 'investorEmail', type: 'string', default: '' },
          { displayName: 'Name', name: 'name', type: 'string', default: '' },
          { displayName: 'Need KYC', name: 'needKyc', type: 'boolean', default: false },
          { displayName: 'Need Whitelist', name: 'needWhitelist', type: 'boolean', default: false },
          { displayName: 'Surname', name: 'surname', type: 'string', default: '' },
        ],
        routing: {
          send: {
            type: 'body',
            property: 'userToMint',
            value: '={{$value}}',
          },
        },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['mintToken'] } },
      },
      {
        displayName: 'Users To Whitelist',
        name: 'userToWhitelist',
        type: 'collection',
        typeOptions: { multipleValues: true, multipleValueButtonText: 'Add User' },
        default: {},
        options: [
          { displayName: 'Whitelist Status', name: 'whitelistStatus', type: 'options', options: [{ name: 'True', value: 'true' }, { name: 'False', value: 'false' }], default: 'true' },
          { displayName: 'Investor Address', name: 'investorAddress', type: 'string', default: '' },
          { displayName: 'Investor Email', name: 'investorEmail', type: 'string', default: '' },
        ],
        routing: {
          send: { type: 'body', property: 'userToWhitelist', value: '={{$value}}' },
        },
        displayOptions: { show: { resource: ['transactions'], operation: ['prepareTransactions'], method: ['whitelist'] } },
      },

      // Send Transactions parameters
      {
        displayName: 'Signed Transactions',
        name: 'signedTransactions',
        type: 'string',
        default: '',
        description: 'Array of signed transaction hex strings',
        routing: {
          send: { type: 'body', property: 'signedTransactions' },
        },
        displayOptions: { show: { resource: ['transactions'], operation: ['sendTransactions'] } },
      },
      {
        displayName: 'Transaction ID',
        name: 'txId',
        type: 'string',
        default: '',
        description: 'Transaction ID returned from prepare-transactions',
        routing: { send: { type: 'body', property: 'txId' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['sendTransactions'] } },
      },

      // Patch Token Docs parameters
      {
        displayName: 'Token Symbol',
        name: 'tokenSymbolPatch',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        description: 'Symbol of the token',
        routing: { send: { type: 'body', property: 'tokenSymbol' } },
        displayOptions: { show: { resource: ['transactions'], operation: ['patchTokenDocs'] } },
      },
      {
        displayName: 'Token Logotype',
        name: 'tokenLogotype',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        description: 'Name of the binary property containing the token logotype image',
        routing: {
          send: {
            type: 'body',
            property: 'tokenLogotype',
          },
        },
        displayOptions: { show: { resource: ['transactions'], operation: ['patchTokenDocs'] } },
      },
      {
        displayName: 'Subscription Agreement',
        name: 'subscriptionAgreement',
        type: 'string',
        default: '',
        description: 'Name of the binary property containing the subscription agreement PDF',
        routing: {
          send: {
            type: 'body',
            property: 'subscriptionAgreement',
          },
        },
        displayOptions: { show: { resource: ['transactions'], operation: ['patchTokenDocs'] } },
      },
      {
        displayName: 'Legal Docs',
        name: 'legalDocs',
        type: 'string',
        default: '',
        description: 'Name of the binary property containing the legal documents PDF',
        routing: {
          send: {
            type: 'body',
            property: 'legalDocs',
          },
        },
        displayOptions: { show: { resource: ['transactions'], operation: ['patchTokenDocs'] } },
      },

      // Info resource operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['info'] } },
        options: [
          {
            name: 'Get Allowance',
            value: 'getAllowance',
            action: 'Get allowance amount for a spender',
            description: 'GET /get-allowance',
            routing: { request: { method: 'GET', url: '/get-allowance' } },
          },
          {
            name: 'Get Balance & Whitelist',
            value: 'getBalanceWhitelist',
            action: 'Get token balance and whitelist status',
            description: 'GET /get-balance-whitelist',
            routing: { request: { method: 'GET', url: '/get-balance-whitelist' } },
          },
          {
            name: 'Get Dividend Distribution Info',
            value: 'getDividendDistributionInfo',
            action: 'Get dividend distribution information',
            description: 'GET /get-dividend-distribution',
            routing: { request: { method: 'GET', url: '/get-dividend-distribution' } },
          },
          {
            name: 'Get Investments By STO ID',
            value: 'getInvestmentsByStoId',
            action: 'Get investments by STO ID',
            description: 'GET /get-investments-by-sto-ID',
            routing: { request: { method: 'GET', url: '/get-investments-by-sto-id' } },
          },
          {
            name: 'Get Investor Info',
            value: 'getInvestorInfo',
            action: 'Get investor information',
            description: 'GET /get-investor-info',
            routing: { request: { method: 'GET', url: '/get-investor-info' } },
          },
          {
            name: 'Get Network Info',
            value: 'getNetworkInfo',
            action: 'Get supported network info',
            description: 'GET /get-network-info',
            routing: { request: { method: 'GET', url: '/get-network-info' } },
          },
          {
            name: 'Get STO Balance',
            value: 'getStoBalance',
            action: 'Get STO balance',
            description: 'GET /get-sto-balance',
            routing: { request: { method: 'GET', url: '/get-sto-balance' } },
          },
          {
            name: 'Get STO By ID',
            value: 'getStoById',
            action: 'Get STO by ID',
            description: 'GET /get-sto-by-ID',
            routing: { request: { method: 'GET', url: '/get-sto-by-id' } },
          },
          {
            name: 'Get STOs',
            value: 'getStos',
            action: 'Get all st os by token symbol',
            description: 'GET /get-stos',
            routing: { request: { method: 'GET', url: '/get-stos' } },
          },
          {
            name: 'Get Token Info',
            value: 'getTokenInfo',
            action: 'Get token info',
            description: 'GET /get-token-info',
            routing: { request: { method: 'GET', url: '/get-token-info' } },
          },
          {
            name: 'Get Tokenizer Info',
            value: 'getTokenizerInfo',
            action: 'Get tokenizer information',
            description: 'GET /get-tokenizer-info',
            routing: { request: { method: 'GET', url: '/get-tokenizer-info' } },
          },
          {
            name: 'Get Transaction Status',
            value: 'getTransactionStatus',
            action: 'Get transaction status',
            description: 'GET /get-transaction-status',
            routing: { request: { method: 'GET', url: '/get-transaction-status' } },
          },
          {
            name: 'Get Whitelist Status',
            value: 'getWhitelistStatus',
            action: 'Check whitelist status for an address',
            description: 'GET /get-whitelist-status',
            routing: { request: { method: 'GET', url: '/get-whitelist-status' } },
          },
        ],
        default: 'getTransactionStatus',
      },

      // ============================================
      // PARAMETER DEFINITIONS
      // ============================================

      // Get Transaction Status parameters
      {
        displayName: 'Transaction Hash',
        name: 'hash',
        type: 'string',
        default: '',
        required: true,
        description: 'Transaction hash to check status',
        routing: { send: { type: 'query', property: 'hash' } },
        displayOptions: { show: { resource: ['info'], operation: ['getTransactionStatus'] } },
      },

      // Token Symbol - shared by most endpoints
      {
        displayName: 'Token Symbol',
        name: 'tokenSymbol',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        required: true,
        description: 'Symbol of the token',
        routing: { send: { type: 'query', property: 'tokenSymbol' } },
        displayOptions: {
          show: {
            resource: ['info'],
            operation: [
              'getTokenInfo',
              'getBalanceWhitelist',
              'getAllowance',
              'getTokenizerInfo',
              'getWhitelistStatus',
              'getDividendDistributionInfo',
              'getInvestmentsByStoId',
              'getInvestorInfo',
              'getStoBalance',
              'getStoById',
              'getStos',
            ],
          },
        },
      },

      // Get Token Info - chainId parameter
      {
        displayName: 'Chain ID',
        name: 'chainId',
        type: 'options',
        options: [
          { name: 'Ethereum Mainnet', value: '1' },
          { name: 'Base Mainnet', value: '2105' },
          { name: 'BNB Smart Chain Mainnet', value: '38' },
          { name: 'Polygon Mainnet', value: '89' },
          { name: 'Sepolia Testnet', value: 'aa36a7' },
          { name: 'Polygon Amoy Testnet', value: '13882' },
          { name: 'Custom', value: 'custom' },
        ],
        default: 'aa36a7',
        required: true,
        description: 'Blockchain network to use. Production networks: Ethereum (1), Base (2105), BNB (38), Polygon (89). Sandbox networks: Sepolia (aa36a7), Polygon Amoy (13882)',
        routing: {
          send: { type: 'body', property: 'chainId' },
        },
        displayOptions: {
          show: { resource: ['info'], operation: ['getTokenInfo'] },
        },
      },

      // Get Balance & Whitelist - investorEmail parameter
      {
        displayName: 'Investor Email',
        name: 'investorEmail',
        type: 'string',
        default: '',
        required: true,
        description: 'Email of the investor',
        routing: { send: { type: 'query', property: 'investorEmail' } },
        displayOptions: { show: { resource: ['info'], operation: ['getBalanceWhitelist'] } },
      },

      // Get Allowance - spenderAddress parameter
      {
        displayName: 'Spender Address',
        name: 'spenderAddress',
        type: 'string',
        default: '',
        required: true,
        description: 'Address of the spender',
        routing: { send: { type: 'query', property: 'spenderAddress' } },
        displayOptions: { show: { resource: ['info'], operation: ['getAllowance'] } },
      },

      // Get Allowance - ownerAddress parameter
      {
        displayName: 'Owner Address',
        name: 'ownerAddress',
        type: 'string',
        default: '',
        required: true,
        description: 'Address of the token owner',
        routing: { send: { type: 'query', property: 'ownerAddress' } },
        displayOptions: { show: { resource: ['info'], operation: ['getAllowance'] } },
      },

      // Get Network Info - chainId parameter
      {
        displayName: 'Chain ID',
        name: 'chainId',
        type: 'options',
        options: [
          { name: 'Ethereum Mainnet', value: '1' },
          { name: 'Base Mainnet', value: '2105' },
          { name: 'BNB Smart Chain Mainnet', value: '38' },
          { name: 'Polygon Mainnet', value: '89' },
          { name: 'Sepolia Testnet', value: 'aa36a7' },
          { name: 'Polygon Amoy Testnet', value: '13882' },
          { name: 'Custom', value: 'custom' },
        ],
        default: 'aa36a7',
        required: true,
        description: 'Blockchain network to use. Production networks: Ethereum (1), Base (2105), BNB (38), Polygon (89). Sandbox networks: Sepolia (aa36a7), Polygon Amoy (13882)',
        routing: {
          send: { type: 'body', property: 'chainId' },
        },
        displayOptions: {
          show: { resource: ['info'], operation: ['getNetworkInfo'] },
        },
      },

      // Get Whitelist Status - investorAddress parameter
      {
        displayName: 'Investor Address',
        name: 'investorAddress',
        type: 'string',
        default: '',
        required: true,
        description: 'Address of the investor to check whitelist status',
        routing: { send: { type: 'query', property: 'investorAddress' } },
        displayOptions: { show: { resource: ['info'], operation: ['getWhitelistStatus'] } },
      },

      // STO ID - shared by multiple STO-related endpoints
      {
        displayName: 'STO ID',
        name: 'id',
        type: 'string',
        default: '',
        required: true,
        description: 'ID of the STO',
        routing: { send: { type: 'query', property: 'id' } },
        displayOptions: {
          show: {
            resource: ['info'],
            operation: ['getInvestmentsByStoId', 'getStoBalance', 'getStoById'],
          },
        },
      },

      // Get Investor Info - email parameter
      {
        displayName: 'Investor Email',
        name: 'email',
        type: 'string',
        placeholder: 'name@email.com',
        default: '',
        required: true,
        description: 'Email of the investor',
        routing: { send: { type: 'query', property: 'email' } },
        displayOptions: { show: { resource: ['info'], operation: ['getInvestorInfo'] } },
      },

      // Get Investor Info - email parameter already defined above
    ],
  };
}