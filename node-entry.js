// Minimal ESM entry shim. Extend as needed for custom Node entry behavior.
export function bootstrap() {
  // No-op bootstrap to avoid missing file errors
  return { startedAt: new Date().toISOString() };
}

export default bootstrap;


