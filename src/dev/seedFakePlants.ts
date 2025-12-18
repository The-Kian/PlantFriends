import auth from "@react-native-firebase/auth";

import saveBasePlantToFirebase from "@/helpers/firebase/saveToFirebase/saveBasePlantToFirebase";
import saveUserPlantToFirebase from "@/helpers/firebase/saveToFirebase/saveUserPlantToFirebase";
import { IPlant, IUserPlant } from "@/constants/IPlant";

const basePlants: IPlant[] = [
  {
    id: "monstera-deliciosa",
    name: "Monstera Deliciosa",
    slug: "monstera deliciosa",
    watering_frequency: 7,
    sun_requirements: "Bright indirect",
    humidity_requirements: "High",
    growth_rate: "Moderate",
    description: "Classic Swiss cheese plant; prefers evenly moist soil.",
    contributedBy: "seed-script",
    isVerified: false,
  },
  {
    id: "sansevieria-trifasciata",
    name: "Snake Plant",
    slug: "snake plant",
    watering_frequency: 14,
    sun_requirements: "Low to bright indirect",
    growth_rate: "Slow",
    description: "Drought tolerant; let soil dry between waterings.",
    contributedBy: "seed-script",
    isVerified: false,
  },
  {
    id: "epipremnum-aureum",
    name: "Golden Pothos",
    slug: "pothos",
    watering_frequency: 7,
    sun_requirements: "Low to medium indirect",
    growth_rate: "Fast",
    description: "Forgiving vining plant; likes light moisture.",
    contributedBy: "seed-script",
    isVerified: false,
  },
  {
    id: "spathiphyllum-wallisii",
    name: "Peace Lily",
    slug: "peace lily",
    watering_frequency: 4,
    sun_requirements: "Low to medium indirect",
    humidity_requirements: "Medium-high",
    growth_rate: "Moderate",
    description: "Prefers consistently damp (not soggy) soil.",
    contributedBy: "seed-script",
    isVerified: false,
  },
  {
    id: "zamioculcas-zamiifolia",
    name: "ZZ Plant",
    slug: "zz plant",
    watering_frequency: 10,
    sun_requirements: "Low to bright indirect",
    growth_rate: "Slow",
    description: "Thick rhizomes store water; avoid overwatering.",
    contributedBy: "seed-script",
    isVerified: false,
  },
  {
    id: "aloe-vera",
    name: "Aloe Vera",
    slug: "aloe vera",
    watering_frequency: 14,
    sun_requirements: "Bright direct to bright indirect",
    growth_rate: "Moderate",
    description: "Succulent; let pot fully dry between drinks.",
    contributedBy: "seed-script",
    isVerified: false,
  },
  {
    id: "chlorophytum-comosum",
    name: "Spider Plant",
    slug: "spider plant",
    watering_frequency: 6,
    sun_requirements: "Medium indirect",
    growth_rate: "Fast",
    description: "Likes lightly moist soil; avoid soggy roots.",
    contributedBy: "seed-script",
    isVerified: false,
  },
  {
    id: "ficus-lyrata",
    name: "Fiddle Leaf Fig",
    slug: "fiddle leaf fig",
    watering_frequency: 7,
    sun_requirements: "Bright indirect",
    growth_rate: "Moderate",
    description: "Let top inch dry, then water thoroughly.",
    contributedBy: "seed-script",
    isVerified: false,
  },
];

const buildUserPlants = (userId: string): IUserPlant[] => [
  {
    id: "seed-up-1",
    userId,
    plantId: "monstera-deliciosa",
    custom_name: "Office Monstera",
    custom_watering_schedule: "Weekly",
    last_watered_date: new Date("2025-12-14T10:00:00.000Z").getTime(),
    next_watering_date: new Date("2025-12-21T10:00:00.000Z").getTime(),
    location: "Office window",
    is_favorite: true,
  },
  {
    id: "seed-up-2",
    userId,
    plantId: "sansevieria-trifasciata",
    custom_name: "Bedroom Snake Plant",
    custom_watering_schedule: "Bi-weekly",
    last_watered_date: new Date("2025-12-10T10:00:00.000Z").getTime(),
    next_watering_date: new Date("2025-12-24T10:00:00.000Z").getTime(),
    location: "Bedroom dresser",
  },
  {
    id: "seed-up-3",
    userId,
    plantId: "spathiphyllum-wallisii",
    custom_name: "Lobby Peace Lily",
    custom_watering_schedule: "Every 3 days",
    last_watered_date: new Date("2025-12-17T08:00:00.000Z").getTime(),
    next_watering_date: new Date("2025-12-20T08:00:00.000Z").getTime(),
    location: "Lobby shelf",
  },
];

export async function seedFakePlants() {
  let user = auth().currentUser;

  if (!user) {
    try {
      const creds = await auth().signInAnonymously();
      user = creds.user;
    } catch (error) {
      console.warn("seedFakePlants: sign-in failed; ensure auth is configured.");
      throw error;
    }
  }

  const userPlants = buildUserPlants(user.uid);

  for (const plant of basePlants) {
    await saveBasePlantToFirebase(plant, user);
  }

  for (const plant of userPlants) {
    await saveUserPlantToFirebase(plant, user);
  }

  return true;
}

export default seedFakePlants;
