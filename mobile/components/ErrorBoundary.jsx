import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong.</Text>
          <Text style={styles.message}>
            We're sorry, but an unexpected error occurred.
          </Text>
          {this.state.error && (
            <Text style={styles.errorDetails}>
              Error: {this.state.error.toString()}
            </Text>
          )}
          {this.state.errorInfo && (
            <Text style={styles.errorDetails}>
              Component Stack: {this.state.errorInfo.componentStack}
            </Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8D7DA', // Light red background for error
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#721C24', // Dark red text
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#721C24',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDetails: {
    fontSize: 12,
    color: '#721C24',
    textAlign: 'left',
    marginTop: 5,
  },
});

export default ErrorBoundary;
