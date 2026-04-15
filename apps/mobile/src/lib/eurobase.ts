import { createClient } from '@forestdream/eurobase-client';
import Constants from 'expo-constants';

const url = (Constants.expoConfig?.extra?.EUROBASE_URL as string) ?? process.env.EXPO_PUBLIC_EUROBASE_URL!;
const apiKey = (Constants.expoConfig?.extra?.EUROBASE_PUBLIC_KEY as string) ?? process.env.EXPO_PUBLIC_EUROBASE_PUBLIC_KEY!;

export const eb = createClient({ url, apiKey });
