declare global {
  interface CloudflareEnv {
    CORTEX_KV?: KVNamespace
    CORTEX_DB?: D1Database
  }
}

export {}
