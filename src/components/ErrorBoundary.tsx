import React from "react";

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";

import { Colors } from "@/theme/Colors";
import { Fonts } from "@/theme/Fonts";
import { Spacing } from "@/theme/Spacing";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("ErrorBoundary caught error:", error, errorInfo);

    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const colors = Colors.light;

      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={styles.iconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Oops! Something went wrong</Text>

            <Text style={[styles.message, { color: colors.text }]}>
              We encountered an unexpected error. Try refreshing the screen or restarting the app.
            </Text>

            {__DEV__ && this.state.error && (
              <>
                <Text style={[styles.devLabel, { color: colors.error }]}>Technical Details (Dev Only):</Text>
                <View style={[styles.detailsContainer, { backgroundColor: colors.card }]}>
                  <Text style={[styles.errorMessage, { color: colors.error }]}>{this.state.error.toString()}</Text>
                  {this.state.errorInfo && (
                    <Text style={[styles.stackTrace, { color: colors.text }]}>{this.state.errorInfo.componentStack}</Text>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.tint }]} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.large,
  },
  iconContainer: {
    marginBottom: Spacing.large,
  },
  errorIcon: {
    fontSize: 64,
  },
  title: {
    fontSize: Fonts.sizeLarge,
    fontWeight: "bold",
    marginBottom: Spacing.medium,
    textAlign: "center",
  },
  message: {
    fontSize: Fonts.sizeMedium,
    textAlign: "center",
    marginBottom: Spacing.large,
    lineHeight: 24,
  },
  devLabel: {
    fontSize: Fonts.sizeSmall,
    fontWeight: "600",
    marginTop: Spacing.large,
    marginBottom: Spacing.medium,
  },
  detailsContainer: {
    borderRadius: 8,
    padding: Spacing.medium,
    marginVertical: Spacing.medium,
    maxHeight: 200,
  },
  errorMessage: {
    fontSize: Fonts.sizeSmall,
    fontFamily: "monospace",
    marginBottom: Spacing.small,
  },
  stackTrace: {
    fontSize: Fonts.sizeSmall,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  button: {
    marginHorizontal: Spacing.large,
    marginBottom: Spacing.large,
    paddingVertical: Spacing.medium,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: Fonts.sizeMedium,
    fontWeight: "600",
  },
});
