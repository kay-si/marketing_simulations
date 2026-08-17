import { z } from "zod";

/**
 * サーバー側で使う環境変数のスキーマを定義
 */
export const serverSchema = z.object({
  DATABASE_URL: z.string(),
  SHADOW_DATABASE_URL: z.string().optional(),
  OPENAI_CHATGPT_KEY: z.string(),
  OPENAI_CHATGPT_MODEL: z.string().default("gpt-4o-mini"),
});

/**
 * クライアント側で使う環境変数のスキーマを定義
 * クライアント側に公開するには、`NEXT_PUBLIC_` プレフィックスをつける
 */
export const clientSchema = z.object({});

/**
 * クライアント側で使う環境変数を定義
 * @type {{ [k in keyof z.infer<typeof clientSchema>]: z.infer<typeof clientSchema>[k] | undefined }}
 */
export const clientEnv = {};
