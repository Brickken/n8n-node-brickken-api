/**
 * Pure JavaScript implementation of Ethereum transaction signing.
 * No external dependencies - uses only built-in crypto operations.
 * Compatible with n8n Cloud restrictions.
 */
export interface TransactionRequest {
    to?: string;
    chainId: number | string;
    value?: string | bigint;
    data?: string;
    gasLimit?: string | bigint;
    nonce?: number | string;
    maxFeePerGas?: string | bigint;
    maxPriorityFeePerGas?: string | bigint;
    gasPrice?: string | bigint;
    type?: number;
    accessList?: Array<{
        address: string;
        storageKeys: string[];
    }>;
}
export declare function keccak256(data: Uint8Array): Uint8Array;
export declare function hexToBytes(hex: string): Uint8Array;
export declare function bytesToHex(bytes: Uint8Array): string;
export declare function privateKeyToAddress(privateKeyHex: string): string;
export declare function signTransaction(tx: TransactionRequest, privateKeyHex: string): string;
//# sourceMappingURL=crypto-utils.d.ts.map