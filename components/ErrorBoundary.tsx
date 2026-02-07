import { Component, type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex flex-1 items-center justify-center bg-background p-6">
          <Text className="mb-2 text-lg font-semibold text-foreground">
            Something went wrong
          </Text>
          <Text className="mb-4 text-center text-muted">
            {this.state.error.message}
          </Text>
          <Pressable
            onPress={this.handleRetry}
            className="rounded-lg bg-primary px-6 py-3"
          >
            <Text className="font-medium text-foreground">Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
