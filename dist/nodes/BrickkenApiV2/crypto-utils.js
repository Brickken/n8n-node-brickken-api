"use strict";
/**
 * Pure JavaScript implementation of Ethereum transaction signing.
 * No external dependencies - uses only built-in crypto operations.
 * Compatible with n8n Cloud restrictions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.keccak256 = keccak256;
exports.hexToBytes = hexToBytes;
exports.bytesToHex = bytesToHex;
exports.privateKeyToAddress = privateKeyToAddress;
exports.signTransaction = signTransaction;
const KECCAK_ROUNDS = 24;
const KECCAK_RC = [
    0x00000001n, 0x00008082n, 0x0000808an, 0x80008000n,
    0x0000808bn, 0x80000001n, 0x80008081n, 0x00008009n,
    0x0000008an, 0x00000088n, 0x80008009n, 0x8000000an,
    0x8000808bn, 0x0000008bn, 0x00008089n, 0x00008003n,
    0x00008002n, 0x00000080n, 0x0000800an, 0x8000000an,
    0x80008081n, 0x00008080n, 0x80000001n, 0x80008008n,
].map((x) => BigInt.asUintN(64, x | (x << 32n)));
const KECCAK_ROTC = [
    1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 2, 14, 27, 41, 56, 8, 25, 43, 62, 18, 39, 61, 20, 44,
];
const KECCAK_PILN = [
    10, 7, 11, 17, 18, 3, 5, 16, 8, 21, 24, 4, 15, 23, 19, 13, 12, 2, 20, 14, 22, 9, 6, 1,
];
const SECP256K1_P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const SECP256K1_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const SECP256K1_GX = 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
const SECP256K1_GY = 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;
const POINT_INFINITY = { x: 0n, y: 0n, isInfinity: true };
function rotl64(x, n) {
    return BigInt.asUintN(64, (x << BigInt(n)) | (x >> BigInt(64 - n)));
}
function keccakF1600(state) {
    const bc = new Array(5);
    for (let round = 0; round < KECCAK_ROUNDS; round++) {
        for (let i = 0; i < 5; i++) {
            bc[i] = state[i] ^ state[i + 5] ^ state[i + 10] ^ state[i + 15] ^ state[i + 20];
        }
        for (let i = 0; i < 5; i++) {
            const t = bc[(i + 4) % 5] ^ rotl64(bc[(i + 1) % 5], 1);
            for (let j = 0; j < 25; j += 5) {
                state[j + i] ^= t;
            }
        }
        let t = state[1];
        for (let i = 0; i < 24; i++) {
            const j = KECCAK_PILN[i];
            bc[0] = state[j];
            state[j] = rotl64(t, KECCAK_ROTC[i]);
            t = bc[0];
        }
        for (let j = 0; j < 25; j += 5) {
            for (let i = 0; i < 5; i++) {
                bc[i] = state[j + i];
            }
            for (let i = 0; i < 5; i++) {
                state[j + i] ^= BigInt.asUintN(64, ~bc[(i + 1) % 5] & bc[(i + 2) % 5]);
            }
        }
        state[0] ^= KECCAK_RC[round];
    }
}
function keccak256(data) {
    const rate = 136;
    const state = new Array(25).fill(0n);
    const padded = new Uint8Array(Math.ceil((data.length + 1) / rate) * rate);
    padded.set(data);
    padded[data.length] = 0x01;
    padded[padded.length - 1] |= 0x80;
    for (let i = 0; i < padded.length; i += rate) {
        for (let j = 0; j < rate / 8; j++) {
            const offset = i + j * 8;
            let lane = 0n;
            for (let k = 0; k < 8; k++) {
                lane |= BigInt(padded[offset + k]) << BigInt(k * 8);
            }
            state[j] ^= lane;
        }
        keccakF1600(state);
    }
    const result = new Uint8Array(32);
    for (let i = 0; i < 4; i++) {
        const lane = state[i];
        for (let j = 0; j < 8; j++) {
            result[i * 8 + j] = Number((lane >> BigInt(j * 8)) & 0xffn);
        }
    }
    return result;
}
function modPow(base, exp, mod) {
    let result = 1n;
    base = ((base % mod) + mod) % mod;
    while (exp > 0n) {
        if (exp & 1n) {
            result = (result * base) % mod;
        }
        exp >>= 1n;
        base = (base * base) % mod;
    }
    return result;
}
function modInverse(a, m) {
    return modPow(a, m - 2n, m);
}
function pointAdd(p1, p2) {
    if (p1.isInfinity)
        return p2;
    if (p2.isInfinity)
        return p1;
    if (p1.x === p2.x) {
        if (p1.y !== p2.y)
            return POINT_INFINITY;
        const s = ((3n * p1.x * p1.x) * modInverse(2n * p1.y, SECP256K1_P)) % SECP256K1_P;
        const x = ((s * s - 2n * p1.x) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
        const y = ((s * (p1.x - x) - p1.y) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
        return { x, y };
    }
    const s = ((p2.y - p1.y) * modInverse((p2.x - p1.x + SECP256K1_P) % SECP256K1_P, SECP256K1_P)) %
        SECP256K1_P;
    const x = ((s * s - p1.x - p2.x) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
    const y = ((s * (p1.x - x) - p1.y) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
    return { x, y };
}
function pointMultiply(k, p) {
    let result = POINT_INFINITY;
    let addend = p;
    while (k > 0n) {
        if (k & 1n) {
            result = pointAdd(result, addend);
        }
        addend = pointAdd(addend, addend);
        k >>= 1n;
    }
    return result;
}
function privateKeyToPublicKey(privateKey) {
    return pointMultiply(privateKey, { x: SECP256K1_GX, y: SECP256K1_GY });
}
function sign(msgHash, privateKey) {
    const z = bytesToBigInt(msgHash);
    const k = generateK(msgHash, privateKey);
    const R = pointMultiply(k, { x: SECP256K1_GX, y: SECP256K1_GY });
    const r = R.x % SECP256K1_N;
    if (r === 0n) {
        throw new Error("Invalid signature: r is zero");
    }
    let s = (modInverse(k, SECP256K1_N) * (z + r * privateKey)) % SECP256K1_N;
    if (s === 0n) {
        throw new Error("Invalid signature: s is zero");
    }
    let v = R.y % 2n === 0n ? 0 : 1;
    if (s > SECP256K1_N / 2n) {
        s = SECP256K1_N - s;
        v = v === 0 ? 1 : 0;
    }
    return { r, s, v };
}
function generateK(msgHash, privateKey) {
    const privBytes = bigIntToBytes(privateKey, 32);
    const combined = new Uint8Array(64);
    combined.set(privBytes, 0);
    combined.set(msgHash, 32);
    let k = keccak256(combined);
    let kInt = bytesToBigInt(k);
    let attempts = 0;
    while (kInt === 0n || kInt >= SECP256K1_N) {
        const newData = new Uint8Array(33);
        newData.set(k, 0);
        newData[32] = attempts++;
        k = keccak256(newData);
        kInt = bytesToBigInt(k);
        if (attempts > 100) {
            throw new Error("Failed to generate valid k");
        }
    }
    return kInt;
}
function rlpEncodeLength(len, offset) {
    if (len < 56) {
        return new Uint8Array([len + offset]);
    }
    const hexLen = len.toString(16);
    const lenBytes = hexLen.length % 2 === 0 ? hexLen : `0${hexLen}`;
    const lenBytesArray = hexToBytes(lenBytes);
    return new Uint8Array([offset + 55 + lenBytesArray.length, ...lenBytesArray]);
}
function rlpEncode(input) {
    if (input instanceof Uint8Array) {
        if (input.length === 1 && input[0] < 0x80) {
            return input;
        }
        const prefix = rlpEncodeLength(input.length, 0x80);
        const result = new Uint8Array(prefix.length + input.length);
        result.set(prefix, 0);
        result.set(input, prefix.length);
        return result;
    }
    let totalLength = 0;
    const encodedItems = [];
    for (const item of input) {
        const encoded = rlpEncode(item);
        encodedItems.push(encoded);
        totalLength += encoded.length;
    }
    const prefix = rlpEncodeLength(totalLength, 0xc0);
    const result = new Uint8Array(prefix.length + totalLength);
    result.set(prefix, 0);
    let offset = prefix.length;
    for (const encoded of encodedItems) {
        result.set(encoded, offset);
        offset += encoded.length;
    }
    return result;
}
function hexToBytes(hex) {
    let normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (normalized.length % 2 !== 0) {
        normalized = `0${normalized}`;
    }
    const bytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}
function bytesToHex(bytes) {
    return `0x${Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")}`;
}
function bytesToBigInt(bytes) {
    let result = 0n;
    for (const byte of bytes) {
        result = (result << 8n) | BigInt(byte);
    }
    return result;
}
function bigIntToBytes(value, length) {
    const hex = value.toString(16).padStart(length * 2, "0");
    return hexToBytes(hex);
}
function bigIntToMinBytes(value) {
    if (value === 0n) {
        return new Uint8Array(0);
    }
    let hex = value.toString(16);
    if (hex.length % 2 !== 0) {
        hex = `0${hex}`;
    }
    return hexToBytes(hex);
}
function stripLeadingZeros(bytes) {
    let index = 0;
    while (index < bytes.length - 1 && bytes[index] === 0) {
        index++;
    }
    return bytes.slice(index);
}
function privateKeyToAddress(privateKeyHex) {
    const privateKey = bytesToBigInt(hexToBytes(privateKeyHex));
    const publicKey = privateKeyToPublicKey(privateKey);
    const pubKeyBytes = new Uint8Array(64);
    const xBytes = bigIntToBytes(publicKey.x, 32);
    const yBytes = bigIntToBytes(publicKey.y, 32);
    pubKeyBytes.set(xBytes, 0);
    pubKeyBytes.set(yBytes, 32);
    const hash = keccak256(pubKeyBytes);
    const addressBytes = hash.slice(12);
    return checksumAddress(bytesToHex(addressBytes));
}
function checksumAddress(address) {
    const normalized = address.toLowerCase().replace("0x", "");
    const hash = bytesToHex(keccak256(new TextEncoder().encode(normalized))).slice(2);
    let result = "0x";
    for (let i = 0; i < 40; i++) {
        result += Number.parseInt(hash[i], 16) >= 8 ? normalized[i].toUpperCase() : normalized[i];
    }
    return result;
}
function toBigInt(value) {
    if (value === undefined || value === null) {
        return 0n;
    }
    if (typeof value === "bigint") {
        return value;
    }
    if (typeof value === "number") {
        return BigInt(value);
    }
    const normalized = value.trim();
    if (normalized === "") {
        return 0n;
    }
    if (normalized.startsWith("0x")) {
        return BigInt(normalized);
    }
    if (/^[0-9]+$/.test(normalized)) {
        return BigInt(normalized);
    }
    if (/^[0-9a-fA-F]+$/.test(normalized)) {
        return BigInt(`0x${normalized}`);
    }
    throw new Error(`Invalid numeric value: ${value}`);
}
function signTransaction(tx, privateKeyHex) {
    const privateKey = bytesToBigInt(hexToBytes(privateKeyHex));
    const chainId = toBigInt(tx.chainId);
    const isEIP1559 = tx.maxFeePerGas !== undefined || tx.type === 2;
    const isEIP2930 = (tx.accessList !== undefined && !isEIP1559) || tx.type === 1;
    if (isEIP1559) {
        return signEIP1559Transaction(tx, privateKey, chainId);
    }
    if (isEIP2930) {
        return signEIP2930Transaction(tx, privateKey, chainId);
    }
    return signLegacyTransaction(tx, privateKey, chainId);
}
function encodeAccessList(accessList) {
    if (!accessList || accessList.length === 0) {
        return [];
    }
    return accessList.map((item) => {
        const address = hexToBytes(item.address);
        const storageKeys = item.storageKeys.map((key) => hexToBytes(key));
        const storageKeysEncoded = rlpEncode(storageKeys);
        return rlpEncode([address, storageKeysEncoded]);
    });
}
function signEIP1559Transaction(tx, privateKey, chainId) {
    const nonce = bigIntToMinBytes(toBigInt(tx.nonce));
    const maxPriorityFeePerGas = bigIntToMinBytes(toBigInt(tx.maxPriorityFeePerGas));
    const maxFeePerGas = bigIntToMinBytes(toBigInt(tx.maxFeePerGas));
    const gasLimit = bigIntToMinBytes(toBigInt(tx.gasLimit));
    const to = tx.to ? hexToBytes(tx.to) : new Uint8Array(0);
    const value = bigIntToMinBytes(toBigInt(tx.value));
    const data = tx.data ? hexToBytes(tx.data) : new Uint8Array(0);
    const accessList = encodeAccessList(tx.accessList);
    const chainIdBytes = bigIntToMinBytes(chainId);
    const toSign = [
        chainIdBytes,
        nonce,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gasLimit,
        to,
        value,
        data,
        accessList.length > 0 ? rlpEncode(accessList) : new Uint8Array(0),
    ];
    const rlpEncoded = rlpEncode(toSign);
    const txType = new Uint8Array([0x02]);
    const messageToSign = new Uint8Array(txType.length + rlpEncoded.length);
    messageToSign.set(txType, 0);
    messageToSign.set(rlpEncoded, txType.length);
    const msgHash = keccak256(messageToSign);
    const { r, s, v } = sign(msgHash, privateKey);
    const toSerialize = [
        chainIdBytes,
        nonce,
        maxPriorityFeePerGas,
        maxFeePerGas,
        gasLimit,
        to,
        value,
        data,
        accessList.length > 0 ? rlpEncode(accessList) : new Uint8Array(0),
        bigIntToMinBytes(BigInt(v)),
        stripLeadingZeros(bigIntToBytes(r, 32)),
        stripLeadingZeros(bigIntToBytes(s, 32)),
    ];
    const signedRlp = rlpEncode(toSerialize);
    const signedTx = new Uint8Array(1 + signedRlp.length);
    signedTx[0] = 0x02;
    signedTx.set(signedRlp, 1);
    return bytesToHex(signedTx);
}
function signEIP2930Transaction(tx, privateKey, chainId) {
    const nonce = bigIntToMinBytes(toBigInt(tx.nonce));
    const gasPrice = bigIntToMinBytes(toBigInt(tx.gasPrice));
    const gasLimit = bigIntToMinBytes(toBigInt(tx.gasLimit));
    const to = tx.to ? hexToBytes(tx.to) : new Uint8Array(0);
    const value = bigIntToMinBytes(toBigInt(tx.value));
    const data = tx.data ? hexToBytes(tx.data) : new Uint8Array(0);
    const accessList = encodeAccessList(tx.accessList);
    const chainIdBytes = bigIntToMinBytes(chainId);
    const toSign = [
        chainIdBytes,
        nonce,
        gasPrice,
        gasLimit,
        to,
        value,
        data,
        accessList.length > 0 ? rlpEncode(accessList) : new Uint8Array(0),
    ];
    const rlpEncoded = rlpEncode(toSign);
    const txType = new Uint8Array([0x01]);
    const messageToSign = new Uint8Array(txType.length + rlpEncoded.length);
    messageToSign.set(txType, 0);
    messageToSign.set(rlpEncoded, txType.length);
    const msgHash = keccak256(messageToSign);
    const { r, s, v } = sign(msgHash, privateKey);
    const toSerialize = [
        chainIdBytes,
        nonce,
        gasPrice,
        gasLimit,
        to,
        value,
        data,
        accessList.length > 0 ? rlpEncode(accessList) : new Uint8Array(0),
        bigIntToMinBytes(BigInt(v)),
        stripLeadingZeros(bigIntToBytes(r, 32)),
        stripLeadingZeros(bigIntToBytes(s, 32)),
    ];
    const signedRlp = rlpEncode(toSerialize);
    const signedTx = new Uint8Array(1 + signedRlp.length);
    signedTx[0] = 0x01;
    signedTx.set(signedRlp, 1);
    return bytesToHex(signedTx);
}
function signLegacyTransaction(tx, privateKey, chainId) {
    const nonce = bigIntToMinBytes(toBigInt(tx.nonce));
    const gasPrice = bigIntToMinBytes(toBigInt(tx.gasPrice));
    const gasLimit = bigIntToMinBytes(toBigInt(tx.gasLimit));
    const to = tx.to ? hexToBytes(tx.to) : new Uint8Array(0);
    const value = bigIntToMinBytes(toBigInt(tx.value));
    const data = tx.data ? hexToBytes(tx.data) : new Uint8Array(0);
    const toSign = [
        nonce,
        gasPrice,
        gasLimit,
        to,
        value,
        data,
        bigIntToMinBytes(chainId),
        new Uint8Array(0),
        new Uint8Array(0),
    ];
    const rlpEncoded = rlpEncode(toSign);
    const msgHash = keccak256(rlpEncoded);
    const { r, s, v } = sign(msgHash, privateKey);
    const vWithChainId = BigInt(v) + 35n + chainId * 2n;
    const toSerialize = [
        nonce,
        gasPrice,
        gasLimit,
        to,
        value,
        data,
        bigIntToMinBytes(vWithChainId),
        stripLeadingZeros(bigIntToBytes(r, 32)),
        stripLeadingZeros(bigIntToBytes(s, 32)),
    ];
    return bytesToHex(rlpEncode(toSerialize));
}
//# sourceMappingURL=crypto-utils.js.map