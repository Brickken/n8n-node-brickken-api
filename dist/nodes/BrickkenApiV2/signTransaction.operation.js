"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signTransactionOperation = signTransactionOperation;
const n8n_workflow_1 = require("n8n-workflow");
const crypto_utils_1 = require("./crypto-utils");
async function signTransactionOperation() {
    const items = this.getInputData();
    const returnData = [];
    for (let i = 0; i < items.length; i++) {
        try {
            const inputJson = items[i]?.json;
            const rawPrivateKey = this.getNodeParameter("privateKey", i);
            const transactionData = this.getNodeParameter("transactionData", i);
            const privateKey = normalizePrivateKey(rawPrivateKey);
            const transactions = normalizeTransactions(transactionData);
            transactions.forEach(validateTransaction);
            const signerAddress = (0, crypto_utils_1.privateKeyToAddress)(privateKey);
            const signedTransactions = transactions.map((transaction) => (0, crypto_utils_1.signTransaction)(transaction, privateKey));
            const transactionHashes = signedTransactions.map((signedTransaction) => (0, crypto_utils_1.bytesToHex)((0, crypto_utils_1.keccak256)((0, crypto_utils_1.hexToBytes)(signedTransaction))));
            const output = {
                ...inputJson,
                signerAddress,
                signedTransactions,
                transactionHashes,
            };
            if (signedTransactions.length === 1) {
                output.signedTransaction = signedTransactions[0];
                output.transactionHash = transactionHashes[0];
            }
            returnData.push({
                json: output,
                pairedItem: { item: i },
            });
        }
        catch (error) {
            if (this.continueOnFail()) {
                returnData.push({
                    json: {
                        ...items[i]?.json,
                        error: error.message,
                    },
                    pairedItem: { item: i },
                });
                continue;
            }
            throw error;
        }
    }
    return [returnData];
}
function normalizePrivateKey(privateKey) {
    if (!/^(0x)?[0-9a-fA-F]{64}$/.test(privateKey)) {
        throw new n8n_workflow_1.ApplicationError("Invalid private key format. Expected 64 hex characters with optional 0x prefix.");
    }
    return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
}
function normalizeTransactions(value) {
    const normalized = typeof value === "string" ? parseJson(value) : value;
    if (Array.isArray(normalized)) {
        return normalized.map(asTransactionRequest);
    }
    if (isRecord(normalized)) {
        if (Array.isArray(normalized.transactions)) {
            return normalized.transactions.map(asTransactionRequest);
        }
        if (isRecord(normalized.transaction)) {
            return [asTransactionRequest(normalized.transaction)];
        }
        return [asTransactionRequest(normalized)];
    }
    throw new n8n_workflow_1.ApplicationError("Transaction data must be a JSON object or an array of transaction objects.");
}
function parseJson(value) {
    try {
        return JSON.parse(value);
    }
    catch {
        throw new n8n_workflow_1.ApplicationError("Invalid JSON in transaction data.");
    }
}
function asTransactionRequest(value) {
    if (!isRecord(value)) {
        throw new n8n_workflow_1.ApplicationError("Each transaction must be a JSON object.");
    }
    return value;
}
function validateTransaction(transaction, index) {
    if (transaction.chainId === undefined || transaction.chainId === null) {
        throw new n8n_workflow_1.ApplicationError(`Transaction at index ${index} is missing "chainId".`);
    }
    if (transaction.to !== undefined && typeof transaction.to !== "string") {
        throw new n8n_workflow_1.ApplicationError(`Transaction at index ${index} has an invalid "to" address.`);
    }
}
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
//# sourceMappingURL=signTransaction.operation.js.map