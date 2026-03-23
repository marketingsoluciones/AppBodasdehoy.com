import { useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8030';

export interface StorageData {
  monthlyCost: number;
  projectedAnnualCost: number;
  topUsers: Array<{
    cost: number;
    fileCount: number;
    storageGB: number;
    userId: string;
    userName: string;
  }>;
  totalFiles: number;
  totalGB: number;
}

export function useStorageData() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStorageData = async () => {
    try {
      setLoading(true);

      // Try real endpoint first, fall back to demo data
      const res = await fetch(`${BACKEND_URL}/api/admin/storage/stats?development=bodasdehoy`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
        return;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      // Fallback: demo data while backend endpoint is not deployed
      setData({
        monthlyCost: 0.1575,
        projectedAnnualCost: 1.89,
        topUsers: [
          { cost: 0.048, fileCount: 450, storageGB: 3.2, userId: 'user_1', userName: 'Juan Pérez' },
          { cost: 0.042, fileCount: 380, storageGB: 2.8, userId: 'user_2', userName: 'María García' },
          { cost: 0.0315, fileCount: 320, storageGB: 2.1, userId: 'user_3', userName: 'Carlos López' },
          { cost: 0.0225, fileCount: 200, storageGB: 1.5, userId: 'user_4', userName: 'Ana Martínez' },
          { cost: 0.0135, fileCount: 150, storageGB: 0.9, userId: 'user_5', userName: 'Luis Sánchez' },
        ],
        totalFiles: 1500,
        totalGB: 10.5,
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  return { data, error, loading, refetch: fetchStorageData };
}

