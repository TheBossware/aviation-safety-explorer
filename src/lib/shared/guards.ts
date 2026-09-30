/**
 * True when `value` is one of `values`, and narrows it to that union. Replaces the
 * `(VALUES as readonly string[]).includes(x)` + `x as T` pair when checking untrusted input
 * (query params, form fields) against an enum's value list.
 */
export function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}

const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * True for a 24-hex-digit MongoDB id. Check ids from URLs and forms with this before querying:
 * anything else makes Mongoose throw a CastError instead of simply finding nothing.
 */
export function isObjectId(value: string): boolean {
  return OBJECT_ID.test(value);
}
