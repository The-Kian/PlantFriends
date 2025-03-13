import { IPlant, IUserPlant } from "@constants/IPlant";

export const mockPlant: IPlant = {
    id: "1",
    name: "Test Plant",
  };
  
export const mockUserPlant: IUserPlant = {
    id: "1",
    userId: "user1",
    plantId: "1",
    houseLocation: "Kitchen",
    custom_attributes: {
      name: "Custom Plant",
    },
  };

  export const mockPlant2: IPlant = {
    id: "2",
    name: "Test Plant 2",
  };