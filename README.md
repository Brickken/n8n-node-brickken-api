# n8n-nodes-brickken

[![npm version](https://badge.fury.io/js/n8n-nodes-brickken.svg)](https://badge.fury.io/js/n8n-nodes-brickken)

n8n community node for the Brickken API V2 - enabling tokenization and Security Token Offering (STO) operations on blockchain through n8n workflows.

## Installation

### Community Nodes (n8n Cloud & Self-Hosted)

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-brickken`
4. Click **Install**

### Manual Installation

```bash
npm install n8n-nodes-brickken
```

## Operations

### Resources

#### Transactions
- **Prepare Transactions** - Create unsigned blockchain transactions
- **Send Transactions** - Submit signed transactions to the blockchain
- **Patch Token Docs** - Update token documents and logotype

#### Info
- **Get Transaction Status** - Check the status of a transaction
- **Get Token Info** - Retrieve token information
- **Get Balance & Whitelist** - Get balance and whitelist status for an address
- **Get Allowance** - Get allowance amount for a spender
- **Get Network Info** - Get supported blockchain network information
- **Get Tokenizer Info** - Get tokenizer details
- **Get Whitelist Status** - Check whitelist status for an address
- **Get Dividend Distribution Info** - Get dividend distribution information
- **Get Investments by STO ID** - Retrieve investments for a specific STO
- **Get Investor Info** - Get investor information
- **Get STO Balance** - Get STO balance
- **Get STO By ID** - Retrieve STO details by ID
- **Get STOs** - Get all STOs for a token symbol

## Credentials

This node requires Brickken API credentials:

1. **API Key** - Your Brickken API key (get it from the Brickken dashboard)
2. **Environment** - Choose between:
   - **Sandbox** - For testing (uses `https://api-sandbox.brickken.com`)
   - **Production** - For live operations (uses `https://api.brickken.com`)

## Usage Example

1. **Add the Brickken API node** to your workflow
2. **Configure credentials** with your API key and environment
3. **Select a resource** (Transactions or Info)
4. **Choose an operation** based on your needs
5. **Fill in required parameters** for the operation

### Example: Get Network Info

```
Resource: Info
Operation: Get Network Info
```

This will return information about supported blockchain networks.

### Example: Create a New Tokenization

```
Resource: Transactions
Operation: Prepare Transactions
Method: newTokenization
Chain ID: Sepolia Testnet (or your preferred network)
Token Symbol: YOUR_TOKEN
Name: Your Token Name
Token Type: EQUITY (or appropriate type)
...
```

## Supported Blockchains

- **Ethereum Mainnet** (Chain ID: 1)
- **Base Mainnet** (Chain ID: 2105)
- **BNB Smart Chain Mainnet** (Chain ID: 38)
- **Polygon Mainnet** (Chain ID: 89)
- **Sepolia Testnet** (Chain ID: aa36a7) - For testing
- **Polygon Amoy Testnet** (Chain ID: 13882) - For testing

## Documentation

- [Brickken Documentation](https://docs.brickken.com)
- [Brickken API Documentation](https://docs.brickken.com/api)
- [n8n Documentation](https://docs.n8n.io)

## License

[MIT](LICENSE)

## Author

**Brickken**
- Website: https://brickken.com
- Email: support@brickken.com
- Documentation: https://docs.brickken.com

## Support

For issues, questions, or feature requests:
- Email: support@brickken.com
- Documentation: https://docs.brickken.com

## Keywords

`n8n-community-node-package`, `brickken`, `tokenization`, `blockchain`, `real-world-assets`, `rwa`
