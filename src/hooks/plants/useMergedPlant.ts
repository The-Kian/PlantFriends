import { useEffect, useState } from 'react';

import { IPlant, IUserPlant } from '@/constants/IPlant';
import fetchFirebasePlantById from '@/helpers/firebase/fetchFirebasePlantById';

const plantCache = new Map<string, IPlant | null>();

export default function useMergedPlant(userPlant: IUserPlant | null) {
  const [mergedPlant, setMergedPlant] = useState<IPlant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!userPlant) {
        setMergedPlant(null);
        setLoading(false);
        return;
      }

      // If the userPlant already contains base/species fields (merged in Redux), use it.
      if ((userPlant as IPlant).name || (userPlant as IPlant).images) {
        setMergedPlant(userPlant as IPlant);
        setLoading(false);
        return;
      }

      if (!userPlant.plantId) {
        setMergedPlant(null);
        setLoading(false);
        return;
      }

      const id = userPlant.plantId;

      if (plantCache.has(id)) {
        if (mounted) setMergedPlant(plantCache.get(id) || null);
        return;
      }

      setLoading(true);
      const fetched = await fetchFirebasePlantById(id);
      plantCache.set(id, fetched);
      if (mounted) {
        setMergedPlant(fetched);
        setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [userPlant]);

  return { mergedPlant, loading } as const;
}
