import { createClient, type EurobaseClient } from '@forestdream/eurobase-client';

const url = process.env.EUROBASE_URL!;
const serviceKey = process.env.EUROBASE_SECRET_KEY!;

// Service-role client (bypasses RLS) for trusted server-side operations.
export const eb: EurobaseClient = createClient({ url, apiKey: serviceKey });

// Create a user-scoped client from an incoming JWT (RLS-enforced).
export function userClient(jwt: string): EurobaseClient {
  return createClient({ url, apiKey: jwt });
}
