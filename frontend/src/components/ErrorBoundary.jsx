import { Component } from 'react';
import { Box, Container, Heading, Text, Button, VStack, Code } from '@chakra-ui/react';

/**
 * App-wide error boundary.
 *
 * Without this, a render error in any page (e.g. an undefined component)
 * unmounts the whole React tree and the user sees a blank white screen
 * with no indication of what went wrong. This surfaces the error instead.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('Uncaught render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box minH="100vh" bg="gray.50" py={20}>
          <Container maxW="lg">
            <VStack spacing={5} align="stretch">
              <Heading size="lg" color="red.600">
                Something went wrong
              </Heading>
              <Text color="gray.600">
                This page hit an unexpected error and couldn&apos;t render. The rest of the
                app is fine — try again or head back to the dashboard.
              </Text>
              {this.state.error?.message && (
                <Code p={3} borderRadius="md" colorScheme="red" whiteSpace="pre-wrap">
                  {this.state.error.message}
                </Code>
              )}
              <VStack spacing={3} align="stretch">
                <Button colorScheme="blue" onClick={this.handleReset}>
                  Try again
                </Button>
                <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
                  Back to Dashboard
                </Button>
              </VStack>
            </VStack>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
