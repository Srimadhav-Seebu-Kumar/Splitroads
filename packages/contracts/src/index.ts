/**
 * @splitroads/contracts — public API
 * These exports are the canonical vocabulary of the entire platform.
 * Changes here are BREAKING for all consumers. Review accordingly.
 */

// Base types
export * from './events/base'

// Intent events
export * from './events/intent'

// Trade schemas + R-multiple math
export * from './trades'

// Phantom schemas
export * from './phantoms'

// Insight schemas (Laws 1 + 4 enforced)
export * from './insights'
