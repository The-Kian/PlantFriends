# Plant API Comparison & Recommendation

## Executive Summary
**Recommendation: Migrate from Perenual to Trefle API**

Trefle offers better data coverage, comprehensive botanical information, and a sustainable free tier that's perfect for hobby projects.

---

## API Comparison

| Feature | Perenual | Trefle | Plant.id | iNaturalist |
|---------|----------|--------|----------|-------------|
| **Database Size** | ~11,000 plants | ~399K species + 27K varieties | 35K taxa (images) | 2M+ observations |
| **Free Tier** | Limited (100 req/day) | 60 req/min (GitHub sponsors: 600) | 10 IDs/month demo | Free with limits |
| **Primary Use** | Plant info + care | Botanical data (comprehensive) | Image identification | Observations/biodiversity |
| **Images** | Good | 32% of species | Excellent (ML trained) | Community photos |
| **Care Information** | Basic | Excellent (89% with bibliography) | N/A | Limited |
| **Growth Conditions** | Limited | 1.4% (room to improve) | N/A | N/A |
| **Distribution Data** | Basic | 80% of species | N/A | Excellent |
| **Open Source** | No | Yes | No | Yes |
| **Data Sources** | Proprietary | USDA, Kew, IPNI, Tropicos, + community | Proprietary ML | Community crowdsourced |
| **Cost for Production** | $10-100+/month | Free or GitHub sponsorship | €5/month + per request | Free |

---

## Trefle API Advantages

### 1. **Better Data Coverage**
- 399,174 species (vs ~11K in Perenual)
- Drawn from authoritative sources: USDA, Kew Gardens, IPNI, Tropicos
- 80% of species have distribution data
- 89% have bibliography & author information
- Active community corrections system

### 2. **Sustainable Pricing**
- **Free tier**: 60 requests/minute (sufficient for most apps)
- **GitHub sponsors**: 600 requests/minute
- No per-request charges after tier selection
- Perfect for hobby projects and small apps

### 3. **Better Plant Care Data**
- Includes growth habits, hardiness zones, edibility & uses (77% coverage)
- Detailed taxonomy (species, variety, subspecies, hybrids, forms, cultivars)
- Distribution & climate zones
- Excellent for building care recommendations

### 4. **Open Source & Ethical**
- Source code on GitHub (MIT-style license)
- Community-driven improvements
- All data properly attributed to sources
- Transparent correction process

### 5. **Developer Experience**
- Comprehensive REST API
- Clean JSON responses
- Excellent documentation
- Pagination support for large result sets
- Filtering and sorting capabilities

---

## Trefle Data Response Example

```json
{
  "data": [
    {
      "id": 76921,
      "common_name": "Valley oak",
      "scientific_name": "Quercus lobata",
      "slug": "quercus-lobata",
      "family": "Fagaceae",
      "genus": "Quercus",
      "image_url": "https://bs.plantnet.org/image/o/...",
      "bibligraphy": "Anales Ci. Nat. 3: 277 (1801)",
      "author": "Née",
      "status": "accepted",
      "rank": "species",
      "synonyms": ["Quercus bicolor var. lyrata", ...],
      "links": {
        "self": "/api/v1/species/quercus-lobata",
        "plant": "/api/v1/plants/quercus-lobata",
        "genus": "/api/v1/genus/quercus"
      }
    }
  ],
  "links": {
    "self": "/api/v1/species/search?q=Quercus",
    "first": "/api/v1/species/search?page=1&q=Quercus",
    "next": "/api/v1/species/search?page=2&q=Quercus",
    "last": "/api/v1/species/search?page=300&q=Quercus"
  }
}
```

---

## Migration Path

### Step 1: Create Trefle Account & Get Token
```
1. Visit https://trefle.io/users/sign_up
2. Create free account
3. Generate API token from dashboard
4. Add to .env: TREFLE_API_KEY=your_token
```

### Step 2: Create Trefle Plant Mapper
Similar to `mapPerenualPlantToIPlant`, create:
```typescript
// src/helpers/plants/plantAPI/mapTreflePlantToIPlant.ts
export const mapTreflePlantToIPlant = (plant: TreflePlant): IPlant => {
  return {
    id: plant.id.toString(),
    name: plant.common_name || plant.scientific_name,
    scientific_name: [plant.scientific_name],
    description: `${plant.family_common_name ? plant.family_common_name + ' - ' : ''}Family: ${plant.family}`,
    // ... map other fields
  };
};
```

### Step 3: Update Fetch Function
```typescript
// src/helpers/plants/plantAPI/fetchPlantAPI.ts
export const fetchTreflePlants = async (searchQuery: string): Promise<IPlant[]> => {
  const URL = `https://trefle.io/api/v1/species/search?token=${TREFLE_API_KEY}&q=${searchQuery}`;
  // ... implementation
};
```

### Step 4: Implement Response Caching
To stay within rate limits, all API responses are cached:
```typescript
// src/services/PlantCacheService.ts - Singleton cache service
// Features:
// - In-memory cache for current session (fast)
// - AsyncStorage for cross-session persistence
// - 24-hour expiration per query
// - Automatic cleanup on expiry

// Usage:
const cached = await PlantCacheService.getSearchResults("tomato");
if (!cached) {
  const plants = await fetchTreflePlants("tomato");
  await PlantCacheService.cacheSearchResults("tomato", plants);
}

// Clear specific query or all cache:
await PlantCacheService.clearQueryCache("tomato");
await PlantCacheService.clearCache();
```

### Step 5: Migrate Search Hooks
- Update `useCombinedPlantSearch` to use Trefle instead of Perenual
- Keep Firebase as secondary source for user-saved plants
- fetchTreflePlants automatically uses cache
- Test thoroughly for data mapping compatibility

---

## Implementation Timeline

- **Phase 1** (1 hour): Setup Trefle account, create mapper, test basic fetch
- **Phase 2** (1-2 hours): Update search hooks, integrate caching, test deduplication
- **Phase 3** (30 min): Remove Perenual dependencies, update .env.example
- **Phase 4** (30 min): Test full search flow, edge cases, cache behavior

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Different data structure | Create comprehensive mapper, write unit tests |
| Rate limiting | Implement request caching in Redux |
| Missing images | Fall back to search alternative or placeholder |
| Library not in Trefle | Still have Firebase fallback |

---

## Recommendation

**Migrate to Trefle API** - It's the best choice for a hobby plant app because:
1. ✅ Free and sustainable
2. ✅ Better data coverage
3. ✅ More comprehensive plant info for care recommendations
4. ✅ Open source and ethical
5. ✅ Active community support
6. ⚠️ Slightly different data structure (easy to adapt)

**Timeframe**: Do this after completing error handling improvements (adds 2-3 hours of work)
