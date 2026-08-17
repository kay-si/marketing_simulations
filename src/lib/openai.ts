import "server-only";
import OpenAI, { APIError } from "openai";
import { serverEnv } from "@/env/server";

const client = new OpenAI({ apiKey: serverEnv.OPENAI_CHATGPT_KEY });

export class OpenAiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OpenAiError";
  }
}

export async function createJsonChatCompletion(params: {
  system: string;
  user: string;
}): Promise<unknown> {
  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await client.chat.completions.create({
      model: serverEnv.OPENAI_CHATGPT_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    });
  } catch (error) {
    if (error instanceof APIError) {
      throw new OpenAiError(`OpenAI API request failed: ${error.message}`, error.status);
    }
    throw error;
  }

  const content = completion.choices[0]?.message?.content;
  if (typeof content !== "string") {
    throw new OpenAiError("OpenAI API response did not include message content");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new OpenAiError("OpenAI API response was not valid JSON");
  }
}
