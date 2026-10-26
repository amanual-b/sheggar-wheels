// Tiny result helpers. Every domain action returns { ok: true, data } or { ok: false, error }.
export const ok = (data = null) => ({ ok: true, data });
export const fail = (error) => ({ ok: false, error });
