/**
 * IntentEvent schemas — decision signals that are NOT trades.
 * Each event type lives under: intent.<surface>.<action>
 *
 * Version history:
 *   v1 (2026-06-12) — initial definitions
 */
import { z } from 'zod'
import { EventEnvelopeSchema } from './base'

// ─── Chart events ─────────────────────────────────────────────────────────────

export const ChartOpenedPayloadSchema = z.object({
  timeframe: z.string(),
  is_revisit: z.boolean(),
  revisit_count: z.number().int().nonnegative().optional(),
})

export const ChartOpenedEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.chart.opened'),
  schema_version: z.literal(1),
  payload: ChartOpenedPayloadSchema,
})
export type ChartOpenedEvent = z.infer<typeof ChartOpenedEventSchema>

export const ChartClosedEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.chart.closed'),
  schema_version: z.literal(1),
  payload: z.object({
    dwell_ms: z.number().int().nonnegative(),
    drawing_count: z.number().int().nonnegative(),
  }),
})

// ─── Drawing events ───────────────────────────────────────────────────────────

export const DrawingKindSchema = z.enum([
  'support',
  'resistance',
  'trend',
  'fib',
  'horizontal',
  'rectangle',
  'other',
])

export const DrawingCreatedEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.drawing.created'),
  schema_version: z.literal(1),
  payload: z.object({
    kind: DrawingKindSchema,
    price_level: z.number().optional(),
    price_level_2: z.number().optional(),
  }),
})

// ─── Alert events ─────────────────────────────────────────────────────────────

export const AlertCreatedEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.alert.created'),
  schema_version: z.literal(1),
  payload: z.object({
    trigger_price: z.number(),
    alert_type: z.enum(['price', 'indicator', 'custom']),
  }),
})

export const AlertTriggeredEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.alert.triggered'),
  schema_version: z.literal(1),
  payload: z.object({
    trigger_price: z.number(),
    market_price_at_trigger: z.number(),
  }),
})

// ─── Order ticket events ──────────────────────────────────────────────────────

export const TicketOpenedEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.ticket.opened'),
  schema_version: z.literal(1),
  payload: z.object({
    inferred_direction: z.enum(['long', 'short']).nullable(),
  }),
})

export const TicketSizeEnteredEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.ticket.size_entered'),
  schema_version: z.literal(1),
  payload: z.object({
    size: z.number().positive(),
    size_type: z.enum(['units', 'dollars', 'percent']),
  }),
})

export const TicketStopModifiedEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.ticket.stop_modified'),
  schema_version: z.literal(1),
  payload: z.object({
    stop_price: z.number(),
    previous_stop_price: z.number().nullable(),
    direction: z.enum(['tightened', 'widened', 'initial']).optional(),
  }),
})

export const TicketTargetModifiedEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.ticket.target_modified'),
  schema_version: z.literal(1),
  payload: z.object({
    target_price: z.number(),
    previous_target_price: z.number().nullable(),
  }),
})

export const TicketHoverEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.ticket.hover'),
  schema_version: z.literal(1),
  payload: z.object({
    side: z.enum(['buy', 'sell']),
    dwell_ms: z.number().int().nonnegative(),
  }),
})

export const TicketCancelledEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.ticket.cancelled'),
  schema_version: z.literal(1),
  payload: z.object({
    had_size: z.boolean(),
    had_stop: z.boolean(),
    had_target: z.boolean(),
    session_duration_ms: z.number().int().nonnegative(),
  }),
})

// ─── Manual intent declaration ────────────────────────────────────────────────

export const IntentDeclaredEventSchema = EventEnvelopeSchema.extend({
  schema: z.literal('intent.note.declared'),
  schema_version: z.literal(1),
  payload: z.object({
    direction: z.enum(['long', 'short']),
    entry_price: z.number().optional(),
    stop_price: z.number().optional(),
    target_price: z.number().optional(),
    size: z.number().positive().optional(),
    thesis: z.string().max(500).optional(),
  }),
})
export type IntentDeclaredEvent = z.infer<typeof IntentDeclaredEventSchema>

// ─── Union ────────────────────────────────────────────────────────────────────

export const IntentEventSchema = z.discriminatedUnion('schema', [
  ChartOpenedEventSchema,
  ChartClosedEventSchema,
  DrawingCreatedEventSchema,
  AlertCreatedEventSchema,
  AlertTriggeredEventSchema,
  TicketOpenedEventSchema,
  TicketSizeEnteredEventSchema,
  TicketStopModifiedEventSchema,
  TicketTargetModifiedEventSchema,
  TicketHoverEventSchema,
  TicketCancelledEventSchema,
  IntentDeclaredEventSchema,
])
export type IntentEvent = z.infer<typeof IntentEventSchema>
export type IntentEventSchema = z.ZodType<IntentEvent>
