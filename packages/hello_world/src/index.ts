import { Buffer } from "buffer";
import { Address } from '@stellar/stellar-sdk';
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from '@stellar/stellar-sdk/contract';
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Typepoint,
  Duration,
} from '@stellar/stellar-sdk/contract';
export * from '@stellar/stellar-sdk'
export * as contract from '@stellar/stellar-sdk/contract'
export * as rpc from '@stellar/stellar-sdk/rpc'

if (typeof window !== 'undefined') {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CB73GOXUHMPBLD3RAQ4HCJ7TB7PYMWTPQHRRQL3GCC3RCKL6E5MJWF45",
  }
} as const


export interface DepositEvent {
  amount: i128;
  new_total_deposits: i128;
  new_user_deposit: i128;
  old_total_deposits: i128;
  old_user_deposit: i128;
  user: string;
}


export interface WithdrawalEvent {
  amount: i128;
  new_total_deposits: i128;
  new_user_deposit: i128;
  old_total_deposits: i128;
  old_user_deposit: i128;
  user: string;
}


export interface BorrowEvent {
  amount: i128;
  max_borrow_limit: i128;
  new_user_borrow: i128;
  old_user_borrow: i128;
  user: string;
}


export interface RepaymentEvent {
  actual_repay_amount: i128;
  amount: i128;
  new_user_borrow: i128;
  old_user_borrow: i128;
  user: string;
}

export const Errors = {

}

export interface Client {
  /**
   * Construct and simulate a record_deposit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_deposit: ({user, amount}: {user: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a record_withdrawal transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_withdrawal: ({user, amount}: {user: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a record_borrow transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_borrow: ({user, amount}: {user: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a record_repayment transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  record_repayment: ({user, amount}: {user: string, amount: i128}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_user_balances transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_user_balances: ({user}: {user: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<readonly [i128, i128]>>

  /**
   * Construct and simulate a get_total_in_system transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_total_in_system: (options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a set_treasury transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_treasury: ({admin}: {admin: string}, options?: {
    /**
     * The fee to pay for the transaction. Default: BASE_FEE
     */
    fee?: number;

    /**
     * The maximum amount of time to wait for the transaction to complete. Default: DEFAULT_TIMEOUT
     */
    timeoutInSeconds?: number;

    /**
     * Whether to automatically simulate the transaction when constructing the AssembledTransaction. Default: true
     */
    simulate?: boolean;
  }) => Promise<AssembledTransaction<null>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initalizing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAADERlcG9zaXRFdmVudAAAAAYAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAASbmV3X3RvdGFsX2RlcG9zaXRzAAAAAAALAAAAAAAAABBuZXdfdXNlcl9kZXBvc2l0AAAACwAAAAAAAAASb2xkX3RvdGFsX2RlcG9zaXRzAAAAAAALAAAAAAAAABBvbGRfdXNlcl9kZXBvc2l0AAAACwAAAAAAAAAEdXNlcgAAABM=",
        "AAAAAQAAAAAAAAAAAAAAD1dpdGhkcmF3YWxFdmVudAAAAAAGAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAAAAAAEm5ld190b3RhbF9kZXBvc2l0cwAAAAAACwAAAAAAAAAQbmV3X3VzZXJfZGVwb3NpdAAAAAsAAAAAAAAAEm9sZF90b3RhbF9kZXBvc2l0cwAAAAAACwAAAAAAAAAQb2xkX3VzZXJfZGVwb3NpdAAAAAsAAAAAAAAABHVzZXIAAAAT",
        "AAAAAQAAAAAAAAAAAAAAC0JvcnJvd0V2ZW50AAAAAAUAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAQbWF4X2JvcnJvd19saW1pdAAAAAsAAAAAAAAAD25ld191c2VyX2JvcnJvdwAAAAALAAAAAAAAAA9vbGRfdXNlcl9ib3Jyb3cAAAAACwAAAAAAAAAEdXNlcgAAABM=",
        "AAAAAQAAAAAAAAAAAAAADlJlcGF5bWVudEV2ZW50AAAAAAAFAAAAAAAAABNhY3R1YWxfcmVwYXlfYW1vdW50AAAAAAsAAAAAAAAABmFtb3VudAAAAAAACwAAAAAAAAAPbmV3X3VzZXJfYm9ycm93AAAAAAsAAAAAAAAAD29sZF91c2VyX2JvcnJvdwAAAAALAAAAAAAAAAR1c2VyAAAAEw==",
        "AAAAAAAAAAAAAAAOcmVjb3JkX2RlcG9zaXQAAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAAAAAAARcmVjb3JkX3dpdGhkcmF3YWwAAAAAAAACAAAAAAAAAAR1c2VyAAAAEwAAAAAAAAAGYW1vdW50AAAAAAALAAAAAA==",
        "AAAAAAAAAAAAAAANcmVjb3JkX2JvcnJvdwAAAAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAAAAAAAQcmVjb3JkX3JlcGF5bWVudAAAAAIAAAAAAAAABHVzZXIAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAAAAAAARZ2V0X3VzZXJfYmFsYW5jZXMAAAAAAAABAAAAAAAAAAR1c2VyAAAAEwAAAAEAAAPtAAAAAgAAAAsAAAAL",
        "AAAAAAAAAAAAAAATZ2V0X3RvdGFsX2luX3N5c3RlbQAAAAAAAAAAAQAAAAs=",
        "AAAAAAAAAAAAAAAMc2V0X3RyZWFzdXJ5AAAAAQAAAAAAAAAFYWRtaW4AAAAAAAATAAAAAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    record_deposit: this.txFromJSON<null>,
        record_withdrawal: this.txFromJSON<null>,
        record_borrow: this.txFromJSON<null>,
        record_repayment: this.txFromJSON<null>,
        get_user_balances: this.txFromJSON<readonly [i128, i128]>,
        get_total_in_system: this.txFromJSON<i128>,
        set_treasury: this.txFromJSON<null>
  }
}