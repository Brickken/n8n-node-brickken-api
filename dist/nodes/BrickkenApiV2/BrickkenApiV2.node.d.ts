import { INodeType, INodeTypeDescription } from "n8n-workflow";
import { signTransactionOperation } from "./signTransaction.operation";
export declare class BrickkenApiV2 implements INodeType {
    description: INodeTypeDescription;
    customOperations: {
        transactions: {
            signTransaction: typeof signTransactionOperation;
        };
    };
}
//# sourceMappingURL=BrickkenApiV2.node.d.ts.map