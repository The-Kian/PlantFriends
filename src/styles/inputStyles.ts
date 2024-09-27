"use strict";
import { StyleSheet } from "react-native";
import { Colors } from "@constants/Colors";

export const inputStyles = StyleSheet.create({
	inputContainer: {
		marginVertical: 10,
		padding: 8,
		borderRadius: 4,
		borderWidth: 1,
		marginHorizontal: 10,
	},
	label: {
		color: 'grey',
		marginBottom: 4,
	},
	labelInvalid: {
		color: "red",
	},
	input: {
		paddingVertical: 8,
		paddingHorizontal: 5,
		backgroundColor: Colors.light.background,
		borderRadius: 4,
		fontSize: 16,
		
	},
	inputInvalid: {
		backgroundColor: "red",
	},
});
