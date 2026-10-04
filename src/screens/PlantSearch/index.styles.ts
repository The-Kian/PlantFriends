import { StyleSheet } from "react-native";

import { Spacing } from "@/theme/Spacing";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.medium + 4,
  },
  status: {
    paddingVertical: Spacing.small,
    textAlign: "center",
  },
  results: {
    flex: 1,
  },
  resultsContent: {
    paddingBottom: Spacing.medium,
  },
  footer: {
    paddingHorizontal: Spacing.medium + 4,
    paddingTop: Spacing.small,
  },
});

export default styles;
