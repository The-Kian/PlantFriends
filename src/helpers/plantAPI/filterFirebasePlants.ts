import { IPlant } from "@constants/IPlant";

const filterFirebasePlants = (query:string, plants: IPlant[]) => {
    return plants.filter(plant =>
        plant.name?.toLowerCase().includes(query.toLowerCase())
    );
}   

export default filterFirebasePlants;