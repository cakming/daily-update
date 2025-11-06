import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  useToast,
  Card,
} from '@chakra-ui/react';
import { authAPI } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetToken } = useParams();
  const toast = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 6 characters',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword(resetToken, { password });

      // Save token and user data for auto-login
      if (response.data.data.token) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }

      toast({
        title: 'Password reset successful',
        description: 'Redirecting to dashboard...',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Reset password error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Invalid or expired reset token',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md">
        <Card.Root p={8}>
          <form onSubmit={handleSubmit}>
            <VStack gap={6} align="stretch">
              <VStack gap={2}>
                <Heading size="lg">Reset Password</Heading>
                <Text color="gray.600" textAlign="center">
                  Enter your new password below
                </Text>
              </VStack>

              <FormControl isRequired>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoFocus
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText="Resetting..."
                w="full"
              >
                Reset Password
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

export default ResetPassword;
