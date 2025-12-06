import { useState } from "react";

import { IPlant } from "@/constants/IPlant";

const usePlantCustomizations = () => {
  const [customizations, setCustomizations] = useState({});

  const handlePlantAttributeChange = <K extends keyof IPlant>(
    field: K,
    value: IPlant[K],
  ) => {
    setCustomizations((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return { customizations, handlePlantAttributeChange };
};

export default usePlantCustomizations;
