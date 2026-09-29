import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export const ISIT_MODEL = "claude-opus-5-5";
/** Classification rarely needs deep reasoning; raise only if the pilot shows headroom. */
export const ISIT_EFFORT = "medium" as const;

export interface StageUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens: number;
  cache_creation_input_tokens: number;
}

export interface StageRequest<T> {
  stage: "gate" | "route" | "select";
  /** Stable per stage (instructions, router list): sent with a cache breakpoint. */
  system: string;
  user: string;
  schema: z.ZodType<T>;
}

export interface StageResponse<T> {
  output: T;
  usage: StageUsage;
  /** Differs from the requested model when a server-side fallback answered. */
  servedModel: string;
}

/** The pipeline depends on this, not on the SDK, so it can be tested with a fake. */
export interface IsitModelClient {
  model: string;
  run<T>(request: StageRequest<T>): Promise<StageResponse<T>>;
}

export class StageError extends Error {
  constructor(
    readonly stage: StageRequest<unknown>["stage"],
    message: string
  ) {
    super(`${stage}: ${message}`);
  }
}

export function createAnthropicClient(model: string = ISIT_MODEL): IsitModelClient {
  const client = new Anthropic(); // ANTHROPIC_API_KEY from the environment; SDK retries 429/5xx twice

  return {
    model,
    async run<T>({ stage, system, user, schema }: StageRequest<T>): Promise<StageResponse<T>> {
      const response = await client.beta.messages.parse({
        model,
        max_tokens: 16000,
        // On a policy decline the API re-runs the request on a fallback model inside the same call.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: ISIT_EFFORT, format: betaZodOutputFormat(schema) },
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: user }],
      });

      if (response.stop_reason === "refusal") {
        throw new StageError(stage, `model declined (${response.stop_details?.category ?? "no category"})`);
      }
      if (response.stop_reason === "max_tokens") {
        throw new StageError(stage, "output truncated at max_tokens");
      }
      if (response.parsed_output === null) {
        throw new StageError(stage, "output did not match the schema");
      }

      return {
        output: response.parsed_output as T,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
          cache_creation_input_tokens: response.usage.cache_creation_input_tokens ?? 0,
        },
        servedModel: response.model,
      };
    },
  };
}
