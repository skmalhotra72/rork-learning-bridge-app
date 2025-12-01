import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = async (): Promise<void> => {
    try {
      if (__DEV__) {
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
        });
        return;
      }

      await Updates.reloadAsync();
    } catch (error) {
      console.error('Failed to reload app:', error);
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.emoji}>😔</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              Don&apos;t worry, this happens sometimes. Your data is safe.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
            >
              <Text style={styles.buttonText}>Restart App</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.errorDetailsContainer}>
                <Text style={styles.errorDetailsTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center' as const,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  errorDetailsContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    maxHeight: 200,
    width: '100%',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: '#DC2626',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    marginBottom: 8,
    fontFamily: 'monospace' as const,
  },
  errorStack: {
    fontSize: 10,
    color: '#B91C1C',
    fontFamily: 'monospace' as const,
  },
});
