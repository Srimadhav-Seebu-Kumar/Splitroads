/**
 * Insight schemas — statistically-validated, user-deliverable findings.
 * PRODUCT LAWS (CLAUDE.md §2.2):
 *   Law 1: sample_n >= 20, CIs required — enforced as Zod refinements
 *   Law 4: loss-framed insights must carry an action — enforced here
 */
import { z } from 'zod'

export const InsightKindSchema = z.enum([
  'hesitation_cost',
  'exit_quality',
  'sizing_gap',
  'discipline_score',
  'fomo_pattern',
  'revenge_trade_pattern',
  'overtrading',
  'tilt_session',
  'improvement_evidence',
])
export type InsightKind = z.infer<typeof InsightKindSchema>

export const InsightSeveritySchema = z.enum(['improvement', 'neutral', 'cost'])

export const InsightClaimSchema = z.object({
  kind: InsightKindSchema,
  metric_value: z.number(),
  metric_unit: z.string(),
  ci_low: z.number(),
  ci_high: z.number(),
  period_days: z.number().int().positive(),
})

export const InsightActionSchema = z.object({
  label: z.string().max(80),
  description: z.string().max(300),
  kind: z.enum(['rule', 'review', 'goal', 'dismiss']),
})

// Law 1 + Law 4 enforced structurally
export const InsightSchema = z
  .object({
    insight_id: z.string().uuid(),
    user_id: z.string().uuid(),
    kind: InsightKindSchema,
    status: z.enum(['candidate', 'published', 'dismissed', 'expired']),
    claim: InsightClaimSchema,
    evidence_refs: z.object({
      phantom_ids: z.array(z.string().uuid()),
      trade_ids: z.array(z.string().uuid()),
    }),
    action: InsightActionSchema.nullable(),
    severity: InsightSeveritySchema,
    sample_n: z.number().int(),
    published_at: z.string().datetime({ offset: false }).nullable(),
    created_at: z.string().datetime({ offset: false }),
  })
  .refine(
    (d) => d.status !== 'published' || d.sample_n >= 20,
    { message: 'Law 1: published insights require sample_n >= 20', path: ['sample_n'] }
  )
  .refine(
    (d) => d.severity !== 'cost' || d.action !== null,
    { message: 'Law 4: cost-severity insights require an action', path: ['action'] }
  )

export type Insight = z.infer<typeof InsightSchema>
