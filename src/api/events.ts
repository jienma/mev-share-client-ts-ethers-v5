import { LogParams } from './interfaces';
import { IMevShareEvent, IPendingBundle, IPendingTransaction } from './interfaces';
import { BigNumber } from 'ethers';

export class PendingTransaction implements IPendingTransaction {
    hash: string
    logs?: LogParams[]
    to?: string
    functionSelector?: string
    callData?: string
    mevGasPrice?: BigNumber
    gasUsed?: BigNumber

    constructor(event: IMevShareEvent) {
        this.hash = event.hash
        this.logs = event.logs || undefined
        this.to = event.txs && event.txs[0].to
        this.functionSelector = event.txs && event.txs[0].functionSelector
        this.callData = event.txs && event.txs[0].callData
        this.gasUsed = event.gasUsed ? BigNumber.from(event.gasUsed) : undefined
        this.mevGasPrice = event.mevGasPrice ? BigNumber.from(event.mevGasPrice) : undefined
    }
}

export class PendingBundle implements IPendingBundle {
    hash: string
    logs?: LogParams[]
    txs?: { to?: string, functionSelector?: string, callData?: string }[]
    mevGasPrice?: BigNumber
    gasUsed?: BigNumber

    constructor(event: IMevShareEvent) {
        this.hash = event.hash
        this.logs = event.logs || undefined
        this.txs = event.txs
        this.gasUsed = event.gasUsed ? BigNumber.from(event.gasUsed) : undefined
        this.mevGasPrice = event.mevGasPrice ? BigNumber.from(event.mevGasPrice) : undefined
    }
}
