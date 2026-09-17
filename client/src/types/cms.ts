/**
 * A relationship read at a depth that resolves it.
 *
 * `payload-types.ts` describes every depth at once (`string | Subtopic`) because nothing in
 * Payload's types is depth-aware: `sdk.find` returns `TransformCollectionWithSelect`, which
 * only picks keys off the generated interface, and `populate` never reaches the return type
 * at all. So the union survives whatever `depth` the query asks for.
 *
 * The narrowing is earned at runtime instead — `lib/cms-content` asserts the relationship
 * came back resolved before it hands the record on. Never assert this without that check:
 * a silently-flat relationship reads as a missing name rather than an error.
 */
export type Populated<T> = Exclude<T, string>;

/** Payload's bookkeeping. Present on every record, read by nothing outside the CMS. */
export type CmsMeta = "createdAt" | "_status" | "updatedAt";
