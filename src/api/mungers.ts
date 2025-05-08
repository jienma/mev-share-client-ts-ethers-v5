import { BundleParams, HintPreferences, SimBundleOptions, TransactionOptions } from './interfaces'
import { BigNumber } from 'ethers'

/**
 * Convert name format of user-specified hints for MEV-Share API requests.
 * @param hints - Hints specified by the user.
 */
const mungeHintPreferences = (hints: HintPreferences) => {
    return {
        contract_address: hints.contractAddress,
        function_selector: hints.functionSelector,
        calldata: hints.calldata,
        logs: hints.logs,
        default_logs: hints.defaultLogs,
        tx_hash: hints.txHash,
        hash: true, // tx hash is always shared on Flashbots MEV-Share; abstract away from user
        // setting all hints except hash to false will enable full privacy
    }
}

/**
 * Converts user-specified hints into the array format accepted by the API.
 * @param hints - Hints specified by the user.
 */
const extractSpecifiedHints = (hints: HintPreferences): string[] => {
    return Object.entries(mungeHintPreferences(hints))
        .map((kv: [string, any]) => kv[1] ? kv[0] : undefined)
        .filter(v => !!v) as string[]
}

/**
 * Converts user-specified parameters into parameters for a sendPrivateTransaction call to the MEV-Share API.
 * @param signedTx - Signed transaction to send.
 * @param options - Privacy/execution settings for the transaction.
 * @returns Single-element array containing params object for sendPrivateTransaction call.
 */
export function mungePrivateTxParams(signedTx: string, options?: TransactionOptions) {
    return [{
        tx: signedTx,
        maxBlockNumber: options?.maxBlockNumber && `0x${options.maxBlockNumber.toString(16)}`,
        preferences: {
            fast: true, // deprecated but required; setting has no effect
            // privacy uses default (Stable) config if not specified
            privacy: (options?.hints || options?.builders) && {
                hints: options?.hints && extractSpecifiedHints(options.hints),
                builders: options?.builders,
            },
        },
    }]
}

/**
 * Converts user-specified parameters into parameters for a mev_sendBundle call to the MEV-Share API.
 * @param params - Privacy/execution parameters for the bundle
 * @returns Single-element array containing params object for sendPrivateTransaction call.
 */
export function mungeBundleParams(params: BundleParams) {
    type AnyBundleItem = {hash?: string, tx?: string, bundle?: any, canRevert?: boolean}
    // recursively munge nested bundle params
    const mungedBundle: any[] = params.body.map((i: AnyBundleItem) =>
        i.bundle ? { bundle: mungeBundleParams(i.bundle) } : i
    )
    return {
        ...params,
        body: mungedBundle,
        version: params.version || "v0.1",
        inclusion: {
            ...params.inclusion,
            block: `0x${params.inclusion.block.toString(16)}`,
            maxBlock: params.inclusion.maxBlock ? `0x${params.inclusion.maxBlock.toString(16)}` : undefined,
        },
        validity: params.validity ? params.validity : {
            refund: [],
            refundConfig: [],
        },
        privacy: params.privacy && {
            ...params.privacy,
            hints: params.privacy.hints && extractSpecifiedHints(params.privacy.hints),
        }
    }
}

/** Convert SimBundleOptions into format required by eth_simBundle.  */
export function mungeSimBundleOptions(params: SimBundleOptions) {
    return {
        ...params,
        // coinbase & timeout can be left as they are
        parentBlock: params.parentBlock && BigNumber.from(params.parentBlock).toHexString(),
        blockNumber: params.blockNumber && BigNumber.from(params.blockNumber).toHexString(),
        timestamp: params.timestamp && BigNumber.from(params.timestamp).toHexString(),
        gasLimit: params.gasLimit && BigNumber.from(params.gasLimit).toHexString(),
        baseFee: params.baseFee && BigNumber.from(params.baseFee).toHexString(),
    }
}
