import { Type, Static } from '@sinclair/typebox';

// ============================================================================
// GET QUOTAS SCHEMAS
// ============================================================================

/**
 * Get Quotas input parameters (no parameters required)
 */
export const GetQuotasInputSchema = Type.Object({}, { additionalProperties: false });

export type GetQuotasInput = Static<typeof GetQuotasInputSchema>;

/**
 * Get Quotas response
 */
export const GetQuotasResponseSchema = Type.Object(
  {
    uid: Type.Optional(
      Type.String({
        format: 'uuid',
        description: 'UUID of the workspace',
      })
    ),
    name: Type.String({
      maxLength: 55,
      description: 'The name of the workspace (maximum 55 characters)',
    }),
    credits_left: Type.Optional(
      Type.Number({
        default: 0,
        description: 'Remaining credits',
      })
    ),
    credits_max: Type.Optional(
      Type.Integer({
        default: 0,
        description: 'Maximum credits allowed',
      })
    ),
    credits_used: Type.Optional(
      Type.Number({
        default: 0,
        description: 'Credits consumed',
      })
    ),
    plan_name: Type.Optional(
      Type.Union([Type.String(), Type.Null()], {
        description: 'Current plan name',
      })
    ),
    current_month_start: Type.Optional(
      Type.Union([Type.String({ format: 'date-time' }), Type.Null()], {
        description: 'Start of current billing period',
      })
    ),
    current_month_end: Type.Optional(
      Type.Union([Type.String({ format: 'date-time' }), Type.Null()], {
        description: 'End of current billing period',
      })
    ),
  },
  { additionalProperties: true }
);

export type GetQuotasResponse = Static<typeof GetQuotasResponseSchema>;

// ============================================================================
// TOOL SCHEMAS (for route registration)
// ============================================================================

export const getQuotasToolSchema = {
  description:
    'Get current workspace quota and billing information. Use this to check your remaining credits, usage statistics, and billing cycle dates. Helpful for monitoring API consumption and planning usage.',
  parameters: GetQuotasInputSchema,
};
