export interface ReceiptInput {
  platform: 'ios' | 'android';
  receipt: string;
  productId: string;
}
export interface ReceiptResult {
  valid: boolean;
  expiresAt: string | null;
}

// Placeholder: real impl calls Apple verifyReceipt and Google Play Developer API.
// Keep the interface stable so callers (routes + tests) don't change.
export async function validateReceipt(input: ReceiptInput): Promise<ReceiptResult> {
  if (!input.receipt) return { valid: false, expiresAt: null };
  // TODO: implement Apple/Google verification w/ shared secret + service account.
  const expires = new Date();
  expires.setMonth(expires.getMonth() + (input.productId.includes('annual') ? 12 : 1));
  return { valid: true, expiresAt: expires.toISOString() };
}
