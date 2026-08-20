import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  PORT: Joi.number().default(3001),
  AI_SERVICE_URL: Joi.string().uri().default('http://localhost:8000'),
  AI_SERVICE_TIMEOUT_MS: Joi.number().min(500).default(4000),
});

/** Coerce env values (e.g. timeout strings → numbers) before ConfigService stores them. */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = envValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    convert: true,
  });

  if (result.error) {
    throw new Error(`Config validation error: ${result.error.message}`);
  }

  return result.value as Record<string, unknown>;
}
