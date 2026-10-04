import { StyleSheet } from "react-native";

export const searchResultStyle = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.75,
  },
  thumb: {
    width: 40,
    height: 40,
  },
  thumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
  },
  scientific: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
});
