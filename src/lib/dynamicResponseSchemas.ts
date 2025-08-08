import { JSONSchema7 } from "json-schema";
import { ALIAS_TO_SLUG, ToolAlias } from "./alias";
import actionsJson from "./actions.json";

// Error response schema (based on actions.json BadRequest response)
const errorResponse: JSONSchema7 = {
  type: "object",
  properties: {
    error_label: {
      type: ["string", "null"]
    },
    error_scope: {
      type: ["string", "null"],
      enum: ["input", "integ", "param", "config"]
    },
    error_ref: {
      type: ["string", "null"],
      examples: ["ERR-12345"]
    },
    message: {
      type: "string"
    },
    status_code: {
      type: ["integer", "null"]
    },
    params: {
      type: ["object", "null"],
      patternProperties: {
        "^[^_].*": {
          type: "string"
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

// Function to extract response schema from actions.json for a given action slug
function extractResponseSchema(actionSlug: string): JSONSchema7 | null {
  try {
    // Find the live endpoint for this action
    const liveEndpoint = `/actions/${actionSlug}/run/live`;
    const endpoint = (actionsJson as any).paths[liveEndpoint];
    
    if (!endpoint?.post?.responses?.["200"]?.content?.["application/json"]?.schema) {
      return null;
    }

    const responseSchema = endpoint.post.responses["200"].content["application/json"].schema;
    
    // If it's a $ref, resolve it
    if (responseSchema.$ref) {
      const refPath = responseSchema.$ref.replace("#/components/schemas/", "");
      return (actionsJson as any).components.schemas[refPath] as JSONSchema7;
    }
    
    return responseSchema as JSONSchema7;
  } catch (error) {
    console.warn(`Failed to extract response schema for ${actionSlug}:`, error);
    return null;
  }
}

// Generate response schemas dynamically for all tools
export function generateResponseSchemas(): Record<string, JSONSchema7> {
  const schemas: Record<string, JSONSchema7> = {};
  
  // Generate schemas for each tool alias
  Object.entries(ALIAS_TO_SLUG).forEach(([alias, slug]) => {
    const responseSchema = extractResponseSchema(slug);
    if (responseSchema) {
      schemas[alias] = responseSchema;
    } else {
      // Fallback to generic schema if extraction fails
      schemas[alias] = {
        type: "object",
        description: `Response for ${alias} tool`,
        additionalProperties: true
      };
    }
  });
  
  return schemas;
}

// Error response schemas for different HTTP status codes
export const ERROR_RESPONSES = {
  400: errorResponse,
  401: errorResponse,
  404: errorResponse,
  500: errorResponse
};

// Export the dynamically generated schemas
export const RESPONSE_SCHEMAS = generateResponseSchemas(); 