/* eslint-disable @typescript-eslint/no-explicit-any */
import firestore from "@react-native-firebase/firestore";

import mockUser from "@test-utils/MockFirebaseUser";
import { mockPlant } from "@test-utils/MockPlant"

import saveBasePlantToFirebase from "./saveBasePlantToFirebase";


describe("saveBasePlantToFirebase", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should save the base plant data if it doesn't exist", async () => {
        const plantData = mockPlant;
        const user = mockUser;

        (firestore as any)._mockGet.mockResolvedValueOnce({ exists: false });

        const result = await saveBasePlantToFirebase(plantData, user);

        const mockFirestoreInstance = firestore();
        
        expect(mockFirestoreInstance.collection("Plants").doc).toHaveBeenCalledWith(plantData.id);
        expect(mockFirestoreInstance.collection("Plants").doc(plantData.id).set).toHaveBeenCalledWith(
            expect.objectContaining({
                ...plantData,
                contributed_by: mockUser.displayName ?? mockUser.email ?? mockUser.uid,
                isVerified: false
            })
        );
        expect(result).toBe(true);
    });

    it("should not save the base plant data if it already exists", async () => {
        const plantData = mockPlant;
        const user = mockUser;

        (firestore as any)._mockGet.mockResolvedValueOnce({ exists: true });

        const result = await saveBasePlantToFirebase(plantData, user);

        const mockFirestoreInstance = firestore();
        
        expect(mockFirestoreInstance.collection("Plants").doc).toHaveBeenCalledWith(plantData.id);
        expect(mockFirestoreInstance.collection("Plants").doc(plantData.id).set).not.toHaveBeenCalled();
        expect(result).toBe(true);
    })

    it("Should throw an error if the save fails", async () => {
        console.error = jest.fn();
        const plantData = mockPlant;
        const user = mockUser;

        (firestore as any)._mockGet.mockResolvedValueOnce({ exists: false });
        (firestore as any)._mockSet.mockRejectedValueOnce(new Error("Failed to save"));

        const result = await saveBasePlantToFirebase(plantData, user);

        expect(result).toBe(false);
    });
});