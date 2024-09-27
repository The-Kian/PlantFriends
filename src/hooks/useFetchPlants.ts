import { IPlant } from "@constants/IPlant";
import { useState, useEffect } from "react";


export const useFetchPlants = (searchQuery: string) => {
    const [plants, setPlants] = useState<IPlant[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    
    useEffect(() => {
        const URL = 'https://openfarm.cc/api/v1'
        if (searchQuery.length === 0) {
            return;
        }

        const fetchPlants = async () => {
            setLoading(true);
            try {
                const response = await fetch(
                    `https://openfarm.cc/api/v1/crops/?filter=${searchQuery}`
                );
                const data = await response.json();
                const plantsData: IPlant[] = data.data.map((plant: any) => ({
                        id: plant.id,
                        attributes: {
                            name: plant.attributes.name,
                            slug: plant.attributes.slug,
                            binomial_name: plant.attributes.binomial_name,
                            common_names: plant.attributes.common_names,
                            description: plant.attributes.description,
                            sun_requirements: plant.attributes.sun_requirements,
                            water_requirements: plant.attributes.water_requirements,
                            temperature_minimum: plant.attributes.temperature_minimum,
                            temperature_maximum: plant.attributes.temperature_maximum,
                        },
                    }));
                setPlants(plantsData);
            } catch (error: any) {
                setError(error.message);
                console.log(`🚀 ~ fetchPlants ~ error.message:`, error.message)
            } finally {
                setLoading(false);
            }
        }
        fetchPlants();
    }, [searchQuery]);
    
    return { plants, loading, error };

};