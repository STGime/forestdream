import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as IAP from 'react-native-iap';
import { Platform } from 'react-native';
import { apiFetch } from '@/lib/api';

const SKUS = Platform.select({
  ios: { monthly: 'forestdream.premium.monthly', annual: 'forestdream.premium.annual' },
  android: { monthly: 'forestdream_premium_monthly', annual: 'forestdream_premium_annual' },
})!;

export function useSubscription() {
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  async function purchase(plan: 'monthly' | 'annual') {
    setLoading(true);
    try {
      await IAP.initConnection();
      const sku = SKUS[plan];
      const purchase = await IAP.requestSubscription({ sku });
      const receipt = Array.isArray(purchase) ? purchase[0]?.transactionReceipt : purchase?.transactionReceipt;
      if (!receipt) return;
      await apiFetch('/iap/validate', {
        method: 'POST',
        body: JSON.stringify({ platform: Platform.OS, receipt, productId: sku }),
      });
      qc.invalidateQueries({ queryKey: ['profile'] });
    } finally {
      setLoading(false);
    }
  }

  return { purchase, loading };
}
