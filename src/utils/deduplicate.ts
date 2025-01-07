import { IPlant } from "@constants/IPlant"

const deduplicate = (raw:IPlant[]) => {
    const uniqueResult: IPlant[] = []
    const seen = new Set()

    raw.forEach((plant: IPlant) => {
        if (!seen.has(plant.id)) {
            uniqueResult.push(plant)
            seen.add(plant.id)
        }
    })
    return uniqueResult
}

export default deduplicate