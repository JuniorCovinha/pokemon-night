/**
 * Gera um id único e legível, prefixado por contexto (ex: "match-a1b2c3").
 * Centralizado aqui para nunca espalhar `crypto.randomUUID()` cru pela app.
 */
export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
