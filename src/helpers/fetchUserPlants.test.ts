import firestore from "@react-native-firebase/firestore";
import fetchUserPlants from "./fetchUserPlants";
import { mockPlant, mockPlant2 } from "@test-utils/MockPlant";

describe("fetchUserPlants", () => {

    it("should fetch user plants from Firestore", async () => {
        const userId = "testUser";
        
        // Setup mock to return specific data
        (firestore as any)._mockGet.mockResolvedValueOnce({
            empty: false,
            docs: [
                { data: () => mockPlant },
                { data: () => mockPlant2 }
            ],
        });
        
        const result = await fetchUserPlants(userId);

        expect(firestore).toHaveBeenCalled();
        expect((firestore as any)._mockCollection).toHaveBeenCalledWith("Users");
        expect((firestore as any)._mockDoc).toHaveBeenCalledWith(userId);
        expect((firestore as any)._mockCollection).toHaveBeenCalledWith("UserPlants");
        expect((firestore as any)._mockGet).toHaveBeenCalled();

        // Check that we got the expected plants back
        expect(result).toEqual([mockPlant, mockPlant2]);
    });


    it("should return an empty array if no plants are found", async () => {
        (firestore as any)._mockGet.mockResolvedValueOnce({
            empty: true,
            docs: [],
        });

        const result = await fetchUserPlants("emptyCollectionUser");
        expect(result).toEqual([]);
    });
});
