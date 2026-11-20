import { useEffect, useState } from "react";

import { IPlant, IUserPlant } from "@/constants/IPlant";
import fetchFirebasePlantById from "@/helpers/firebase/fetchFirebasePlantById";

// Species that loaded (or are known not to exist). A failed lookup is never
// stored here, so it's tried again next time.
const plantCache = new Map<string, IPlant | null>();

export default function useMergedPlant(userPlant: IUserPlant | null): {
  readonly mergedPlant: IPlant | null;
  readonly loading: boolean;
  readonly unavailable?: boolean;
} {
  const [mergedPlant, setMergedPlant] = useState<IPlant | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  // True when the species couldn't be loaded (offline, say), as opposed to
  // there being none. The screen can show the plant's nickname and a note.
  const [unavailable, setUnavailable] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setUnavailable(false);

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
      try {
        const fetched = await fetchFirebasePlantById(id);
        plantCache.set(id, fetched);
        if (mounted) {
          setMergedPlant(fetched);
          setLoading(false);
        }
      } catch {
        // Not cached: the next render tries again.
        if (mounted) {
          setMergedPlant(null);
          setUnavailable(true);
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [userPlant]);

  return { mergedPlant, loading, unavailable };
}

/** Forgets cached species. For tests. */
export function clearMergedPlantCache() {
  plantCache.clear();
}
