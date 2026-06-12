/**
 * Phantom schemas — counterfactual simulation types.
 * From PHANTOM_ENGINE.md: a Phantom is a versioned, deterministic simulation of a trade
 * that was not taken as simulated.
 */
import { z } from 'zod'

export const PhantomTypeSchema = z.enum([
  'ABANDONED_ENTRY',
  'DELAYED_ENTRY',
  'PREMATURE_EXIT',
  'DELAYED_EXIT',
  'CONVICTION',
  'POSITION_SIZE',
  'STOP_PLACEMENT',
  'OPPOSITE_PERSONALITY',
])
export type PhantomType = z.infer<typeof PhantomTypeSchema>

export const PhantomStatusSchema = z.enum([
  'active',
  'resolved',
  'expired',
  'invalidated',
  'pruned',
])
export type PhantomStatus = z.infer<typeof PhantomStatusSchema>

export const ParamProvenanceSchema = z.enum(['observed', 'plan', 'default'])
export type ParamProvenance = z.infer<typeof ParamProvenanceSchema>

// Counterfactual parameters with full provenance
export const PhantomParamsSchema = z.object({
  entry: z.number(),
  entry_provenance: ParamProvenanceSchema,
  stop: z.number().nullable(),
  stop_provenance: ParamProvenanceSchema.nullable(),
  target: z.number().nullable(),
  target_provenance: ParamProvenanceSchema.nullable(),
  size: z.number().positive(),
  size_provenance: ParamProvenanceSchema,
})
export type PhantomParams = z.infer<typeof PhantomParamsSchema>

// Exit policy for simulation
export const ExitPolicySchema = z.object({
  kind: z.enum(['bracket', 'trailing', 'time_stop', 'reference_plan']),
  trailing_pct: z.number().optional(),
  time_stop_bars: z.number().int().positive().optional(),
})
export type ExitPolicy = z.infer<typeof ExitPolicySchema>

// Phantom outcome (distribution, not a point)
export const PhantomOutcomeSchema = z.object({
  r_p05: z.number().nullable(),
  r_p50: z.number().nullable(),
  r_p95: z.number().nullable(),
  mfe_r: z.number().nullable(),       // max favourable excursion in R
  mae_r: z.number().nullable(),       // max adverse excursion in R
  bars_held: z.number().int().nonnegative().nullable(),
  exit_reason: z.enum(['stop', 'target', 'time_stop', 'structure', 'no_fill']).nullable(),
  sim_paths: z.number().int().positive(),
  sim_seed: z.number().int(),
})
export type PhantomOutcome = z.infer<typeof PhantomOutcomeSchema>

// Spawn request — what the Intent Engine sends to the Phantom Engine
export const PhantomSpawnRequestSchema = z.object({
  phantom_type: PhantomTypeSchema,
  user_id: z.string().uuid(),
  origin_session_id: z.string().uuid().nullable(),
  origin_trade_id: z.string().uuid().nullable(),
  spawn_intent_score: z.number().min(0).max(1).nullable(),
  instrument: z.object({
    symbol: z.string(),
    venue: z.string(),
    asset_class: z.string(),
  }),
  direction: z.enum(['long', 'short']),
  params: PhantomParamsSchema,
  exit_policy: ExitPolicySchema,
  cf_decision_time: z.string().datetime({ offset: false }),
  sim_version: z.string(),
})
export type PhantomSpawnRequest = z.infer<typeof PhantomSpawnRequestSchema>
