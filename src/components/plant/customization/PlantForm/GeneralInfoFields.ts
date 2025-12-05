// fieldsConfig.ts

import { IPlant } from "@/constants/IPlant";

type FieldType = "text" | "number" | "picker" | "date";

interface FieldConfig {
  label: string;

  field: keyof IPlant;

  /**
   * The type of input field to render.
   */
  type: FieldType;

  /**
   * Options for picker fields.
   * Only applicable when type is 'picker'.
   */
  options?: string[];
}

export const generalInfoFields: FieldConfig[] = [
  { label: "Name", field: "name", type: "text" },
  { label: "Scientific Name", field: "scientific_name", type: "text" },
  {
    label: "Sun Requirements",
    field: "sun_requirements",
    type: "picker",
    options: ["Full Sun", "Partial Sun", "Partial Shade", "Full Shade"],
  },
  {
    label: "Watering Frequency (in days)",
    field: "watering_frequency",
    type: "number",
  },
  { label: "Fertilizer Needs", field: "fertilizer_needs", type: "text" },
  {
    label: "Minimum Temperature",
    field: "temperature_minimum",
    type: "number",
  },
  {
    label: "Maximum Temperature",
    field: "temperature_maximum",
    type: "number",
  },
  {
    label: "Growth Rate",
    field: "growth_rate",
    type: "picker",
    options: ["Slow", "Moderate", "Fast"],
  },
];
