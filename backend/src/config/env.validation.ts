import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  PORT: Joi.number().default(3000),
});
