/**
 * Typed failures for the content layer.
 *
 * Everything in `src/data/site.ts` is developer-authored config, so a bad value
 * there is a build-time mistake rather than a runtime condition to recover
 * from. Throwing a `ConfigError` during the build is deliberate: it stops the
 * deploy at the point the typo was introduced instead of shipping a page that
 * renders `NaN` or an empty countdown to visitors.
 */
export type ConfigErrorCode = 'invalid-date' | 'invalid-seat-curve' | 'missing-placeholder';

export class ConfigError extends Error {
  readonly code: ConfigErrorCode;
  /** Values are scalars so the message can always be rendered in a build log. */
  readonly context: Record<string, string | number>;

  constructor(
    code: ConfigErrorCode,
    message: string,
    context: Record<string, string | number> = {},
  ) {
    super(message);
    this.name = 'ConfigError';
    this.code = code;
    this.context = context;
  }
}
