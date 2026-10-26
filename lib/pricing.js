// Pricing rules. The renter pays subtotal + a 10% mock platform fee.
// The owner earns the subtotal; the platform "commission" is the fee.
export const SERVICE_FEE_RATE = 0.1;

export function computePricing(pricePerDay, days) {
  const price = Number(pricePerDay);
  const n = Number(days);
  const subtotal = Math.round(price * n);
  const fee = Math.round(subtotal * SERVICE_FEE_RATE);
  return { pricePerDay: price, days: n, subtotal, fee, total: subtotal + fee };
}

/** Clearly fake transaction reference. Never a real payment id. */
export function makePaymentRef() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SW-TB-${part()}${part()}`;
}
