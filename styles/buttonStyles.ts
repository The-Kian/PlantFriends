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
    marginTop: 16,
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