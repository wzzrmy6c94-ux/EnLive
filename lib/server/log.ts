export function logInfo(event: string, meta: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", event, ...meta, ts: new Date().toISOString() }));
}

export function logWarn(event: string, meta: Record<string, unknown> = {}) {
  console.warn(JSON.stringify({ level: "warn", event, ...meta, ts: new Date().toISOString() }));
}

export function logError(event: string, meta: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ level: "error", event, ...meta, ts: new Date().toISOString() }));
}
