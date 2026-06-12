/**
 * Base interface every broker connector implements.
 * DRY: all connector-specific code lives in its own file;
 * importTrades() in trade.service calls the same interface everywhere.
 */
import type { NormalisedTrade } from '@splitroads/contracts'

export interface BrokerConnector {
  readonly broker: NormalisedTrade['source']
  fetchTrades(accountId: string, from: Date, to: Date): Promise<NormalisedTrade[]>
}

export type ConnectorCredentials = {
  apiKey?: string
  apiSecret?: string
  accountNumber?: string
  [key: string]: string | undefined
}
