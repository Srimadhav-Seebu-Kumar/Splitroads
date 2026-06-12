/**
 * ID generation. UUIDv4 via crypto.randomUUID() — standard across all models.
 * One import, used everywhere — no ad-hoc uuid() calls scattered around.
 */
export const newId = () => crypto.randomUUID()
