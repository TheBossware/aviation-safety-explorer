/**
 * True when `value` is one of `values`, and narrows it to that union. Replaces the
 * `(VALUES as readonly string[]).includes(x)` + `x as T` pair when checking untrusted input
 * (query params, form fields) against an enum's value list.
 */
export function isOneOf<T extends string>(values: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (values as readonly string[]).includes(value);
}
