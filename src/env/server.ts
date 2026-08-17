import "server-only";
import { serverSchema, clientEnv } from "./schema";

const _serverEnv = serverSchema.safeParse(process.env);

// 検証に失敗した場合はビルドエラーにする
if (!_serverEnv.success) {
  console.error(
    "❌ Invalid server environment variables:",
    JSON.stringify(_serverEnv.error.format(), null, 4),
  );
  process.exit(1);
}

export const serverEnv = { ..._serverEnv.data, ...clientEnv };
