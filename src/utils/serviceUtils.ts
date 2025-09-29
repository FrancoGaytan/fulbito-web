export async function parseJsonSafe(res: Response) {
  try { return await res.json(); } catch { return null; }
}

export function buildError(res: Response, fallback: string) {
  const err = new Error(fallback);
  (err as any).status = res.status;
  return err;
}