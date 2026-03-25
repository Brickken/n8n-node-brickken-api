import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
} from "n8n-workflow";
import { ApplicationError } from "n8n-workflow";
import {
  bytesToHex,
  hexToBytes,
  keccak256,
  privateKeyToAddress,
  signTransaction,
} from "./crypto-utils";
import type { TransactionRequest } from "./crypto-utils";

export async function signTransactionOperation(
  this: IExecuteFunctions
): Promise<INodeExecutionData[][]> {
  const items = this.getInputData();
  const returnData: INodeExecutionData[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const inputJson = items[i]?.json as IDataObject;
      const rawPrivateKey = this.getNodeParameter("privateKey", i) as string;
      const transactionData = this.getNodeParameter("transactionData", i);
      const privateKey = normalizePrivateKey(rawPrivateKey);
      const transactions = normalizeTransactions(transactionData);

      transactions.forEach(validateTransaction);

      const signerAddress = privateKeyToAddress(privateKey);
      const signedTransactions = transactions.map((transaction) =>
        signTransaction(transaction, privateKey)
      );
      const transactionHashes = signedTransactions.map((signedTransaction) =>
        bytesToHex(keccak256(hexToBytes(signedTransaction)))
      );

      const output: IDataObject = {
        ...inputJson,
        signerAddress,
        signedTransactions,
        transactionHashes,
      };

      returnData.push({
        json: output,
        pairedItem: { item: i },
      });
    } catch (error) {
      if (this.continueOnFail()) {
        returnData.push({
          json: {
            ...(items[i]?.json as IDataObject),
            error: (error as Error).message,
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

function normalizePrivateKey(privateKey: string): string {
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new ApplicationError(
      "Invalid private key format. Expected 64 hex characters with optional 0x prefix."
    );
  }

  return privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
}

function normalizeTransactions(value: unknown): TransactionRequest[] {
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

  throw new ApplicationError(
    "Transaction data must be a JSON object or an array of transaction objects."
  );
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new ApplicationError("Invalid JSON in transaction data.");
  }
}

function asTransactionRequest(value: unknown): TransactionRequest {
  if (!isRecord(value)) {
    throw new ApplicationError(
      "Each transaction must be a JSON object."
    );
  }

  return value as unknown as TransactionRequest;
}

function validateTransaction(transaction: TransactionRequest, index: number): void {
  if (transaction.chainId === undefined || transaction.chainId === null) {
    throw new ApplicationError(
      `Transaction at index ${index} is missing "chainId".`
    );
  }

  if (transaction.to !== undefined && typeof transaction.to !== "string") {
    throw new ApplicationError(
      `Transaction at index ${index} has an invalid "to" address.`
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
