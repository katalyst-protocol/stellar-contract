import { Buffer } from "buffer";
import { Client as ContractClient, Spec as ContractSpec, } from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk';
export * as contract from '@stellar/stellar-sdk/contract';
export * as rpc from '@stellar/stellar-sdk/rpc';
if (typeof window !== 'undefined') {
    //@ts-ignore Buffer exists
    window.Buffer = window.Buffer || Buffer;
}
export const networks = {
    testnet: {
        networkPassphrase: "Test SDF Network ; September 2015",
        contractId: "CB73GOXUHMPBLD3RAQ4HCJ7TB7PYMWTPQHRRQL3GCC3RCKL6E5MJWF45",
    }
};
export const Errors = {};
export class Client extends ContractClient {
    options;
    static async deploy(
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options) {
        return ContractClient.deploy(null, options);
    }
    constructor(options) {
        super(new ContractSpec(["AAAAAQAAAAAAAAAAAAAADERlcG9zaXRFdmVudAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAASbmV3X3RvdGFsX2RlcG9zaXRzAAAAAAALAAAAAAAAABBuZXdfdXNlcl9kZXBvc2l0AAAACwAAAAAAAAASb2xkX3RvdGFsX2RlcG9zaXRzAAAAAAALAAAAAAAAABBvbGRfdXNlcl9kZXBvc2l0AAAACwAAAAAAAAAEdXNlcgAAABM=",
            "AAAAAQAAAAAAAAAAAAAAD1dpdGhkcmF3YWxFdmVudAAAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEm5ld190b3RhbF9kZXBvc2l0cwAAAAAACwAAAAAAAAAQbmV3X3VzZXJfZGVwb3NpdAAAAAsAAAAAAAAAEm9sZF90b3RhbF9kZXBvc2l0cwAAAAAACwAAAAAAAAAQb2xkX3VzZXJfZGVwb3NpdAAAAAsAAAAAAAAABHVzZXIAAAAT",
            "AAAAAQAAAAAAAAAAAAAAC0JvcnJvd0V2ZW50AAAAAAUAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAQbWF4X2JvcnJvd19saW1pdAAAAAsAAAAAAAAAD25ld191c2VyX2JvcnJvdwAAAAALAAAAAAAAAA9vbGRfdXNlcl9ib3Jyb3cAAAAACwAAAAAAAAAEdXNlcgAAABM=",
            "AAAAAQAAAAAAAAAAAAAADlJlcGF5bWVudEV2ZW50AAAAAAAFAAAAAAAAABNhY3R1YWxfcmVwYXlfYW1vdW50AAAAAAsAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAPbmV3X3VzZXJfYm9ycm93AAAAAAsAAAAAAAAAD29sZF91c2VyX2JvcnJvdwAAAAALAAAAAAAAAAR1c2VyAAAAEw==",
            "AAAAAAAAAAAAAAAOcmVjb3JkX2RlcG9zaXQAAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
            "AAAAAAAAAAAAAAARcmVjb3JkX3dpdGhkcmF3YWwAAAAAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
            "AAAAAAAAAAAAAAANcmVjb3JkX2JvcnJvdwAAAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
            "AAAAAAAAAAAAAAAQcmVjb3JkX3JlcGF5bWVudAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
            "AAAAAAAAAAAAAAARZ2V0X3VzZXJfYmFsYW5jZXMAAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPtAAAAAgAAAAsAAAAL",
            "AAAAAAAAAAAAAAATZ2V0X3RvdGFsX2luX3N5c3RlbQAAAAAAAAAAAQAAAAs=",
            "AAAAAAAAAAAAAAAMc2V0X3RyZWFzdXJ5AAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA=="]), options);
        this.options = options;
    }
    fromJSON = {
        record_deposit: (this.txFromJSON),
        record_withdrawal: (this.txFromJSON),
        record_borrow: (this.txFromJSON),
        record_repayment: (this.txFromJSON),
        get_user_balances: (this.txFromJSON),
        get_total_in_system: (this.txFromJSON),
        set_treasury: (this.txFromJSON)
    };
}
