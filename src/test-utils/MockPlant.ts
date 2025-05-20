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

  export const mockUserPlant2: IUserPlant = {
    id: "2",
    userId: "user2",
    plantId: "2",
    houseLocation: "Living Room",
    custom_attributes: {
      name: "Custom Plant 2",
    },
  };

  export const mockPlant2: IPlant = {
    id: "2",
    name: "Test Plant 2",
  };