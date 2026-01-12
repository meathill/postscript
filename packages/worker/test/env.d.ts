/**
 * 测试环境类型声明
 */
declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    KV: KVNamespace;
    JWT_SECRET: string;
    HSM_SECRET_PART: string;
    APPLE_CLIENT_ID: string;
    APPLE_TEAM_ID: string;
    APPLE_KEY_ID: string;
    APPLE_PRIVATE_KEY: string;
  }
}
