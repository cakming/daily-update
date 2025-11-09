import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  Button,
  Text,
  Spinner,
  Card,
} from '@chakra-ui/react';
import { authAPI } from '../services/api';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { verificationToken } = useParams();

  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    verifyEmail();
  }, [verificationToken]);

  const verifyEmail = async () => {
    try {
      const response = await authAPI.verifyEmail(verificationToken);

      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Verify email error:', error);
      setStatus('error');
      setMessage(error.response?.data?.message || 'Invalid or expired verification link');
    }
  };

  if (status === 'verifying') {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Card.Root p={8}>
            <VStack gap={6}>
              <Spinner size="xl" color="blue.500" />
              <Heading size="lg">Verifying Email...</Heading>
              <Text color="gray.600" textAlign="center">
                Please wait while we verify your email address
              </Text>
            </VStack>
          </Card.Root>
        </Container>
      </Box>
    );
  }

  if (status === 'success') {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Container maxW="md">
          <Card.Root p={8}>
            <VStack gap={6}>
              <Text fontSize="5xl">✅</Text>
              <Heading size="lg" color="green.600">
                Email Verified!
              </Heading>
              <Text color="gray.600" textAlign="center">
                {message}
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                Redirecting you to the dashboard...
              </Text>
              <Button
                onClick={() => navigate('/dashboard')}
                colorScheme="green"
                w="full"
              >
                Go to Dashboard Now
              </Button>
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
          <VStack gap={6}>
            <Text fontSize="5xl">❌</Text>
            <Heading size="lg" color="red.600">
              Verification Failed
            </Heading>
            <Text color="gray.600" textAlign="center">
              {message}
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              The verification link may have expired or been used already.
            </Text>
            <Button
              onClick={() => navigate('/login')}
              colorScheme="blue"
              w="full"
            >
              Back to Login
            </Button>
          </VStack>
        </Card.Root>
      </Container>
    </Box>
  );
};

export default VerifyEmail;
