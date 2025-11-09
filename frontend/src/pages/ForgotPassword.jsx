import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  
  Card,
  useToast,
} from '@chakra-ui/react';
import { authAPI } from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });

      setSubmitted(true);
      toast({
        title: 'Check your email',
        description: 'If an account exists, a password reset link has been sent.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Card.Root p={8}>
            <VStack gap={6} align="stretch">
              <VStack gap={2}>
                <Text fontSize="4xl">📧</Text>
                <Heading size="lg" textAlign="center">
                  Check Your Email
                </Heading>
              </VStack>

              <Text textAlign="center" color="gray.600">
                If an account with <strong>{email}</strong> exists, we've sent a password reset link.
              </Text>

              <Text fontSize="sm" textAlign="center" color="gray.500">
                The link will expire in 1 hour. Check your spam folder if you don't see it.
              </Text>

              <VStack gap={2}>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  w="full"
                >
                  Send Another Email
                </Button>
                <Button
                  onClick={() => navigate('/login')}
                  colorScheme="blue"
                  w="full"
                >
                  Back to Login
                </Button>
              </VStack>
            </VStack>
          </Card.Root>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <Card.Root p={8}>
          <form onSubmit={handleSubmit}>
            <VStack gap={6} align="stretch">
              <VStack gap={2}>
                <Heading size="lg">Forgot Password?</Heading>
                <Text color="gray.600" textAlign="center">
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
              </VStack>

              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  autoFocus
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText="Sending..."
                w="full"
              >
                Send Reset Link
              </Button>

              <Text fontSize="sm" textAlign="center">
                Remember your password?{' '}
                <Link to="/login" style={{ color: '#3182CE', textDecoration: 'underline' }}>
                  Back to Login
                </Link>
              </Text>
            </VStack>
          </form>
        </Card.Root>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
