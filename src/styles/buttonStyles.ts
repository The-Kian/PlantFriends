import { StyleSheet } from "react-native";

export const createButtonStyles = (theme: any) => StyleSheet.create({
  buttons: {
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: theme.colors.background,
    elevation: 2,
    shadowColor: 'black',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    marginTop: 8,
  },
  iconButton: {
    margin: 8,
    borderRadius: 20,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    textAlign: 'center',
    justifyContent: 'center',
    color: theme.colors.text,
    fontSize: 16,
  },
});

export const searchResultStyle = StyleSheet.create({
  container: {
    padding: 5,
    margin: 5,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "90%",
    height: 50,
    borderWidth: 2,
  },
});