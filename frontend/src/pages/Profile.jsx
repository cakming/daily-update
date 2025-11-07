import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Badge,
  Text,
} from '@chakra-ui/react';
import { authAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'New password must be at least 6 characters',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await authAPI.updateProfile(updateData);

      // Update local user data
      const updatedUser = response.data.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast({
        title: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    try {
      await authAPI.sendVerification();
      toast({
        title: 'Verification email sent',
        description: 'Please check your email inbox',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to send verification',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="purple.600">
              Profile Settings
            </Heading>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="2xl" py={8}>
        <Card.Root p={8}>
          <form onSubmit={handleSubmit}>
            <VStack gap={6} align="stretch">
              <Heading size="md">Account Information</Heading>

              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your name"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>
                  Email
                  {user?.emailVerified ? (
                    <Badge ml={2} colorScheme="green" fontSize="xs">
                      Verified
                    </Badge>
                  ) : (
                    <Badge ml={2} colorScheme="orange" fontSize="xs">
                      Not Verified
                    </Badge>
                  )}
                </FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
                {!user?.emailVerified && (
                  <Button
                    onClick={handleSendVerification}
                    size="sm"
                    variant="link"
                    colorScheme="blue"
                    mt={1}
                  >
                    Send Verification Email
                  </Button>
                )}
              </FormControl>

              <Box borderTopWidth="1px" pt={6} mt={4}>
                <Heading size="md" mb={4}>
                  Security Settings
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Enhance your account security
                </Text>
                <Button
                  onClick={() => navigate('/2fa-setup')}
                  colorScheme="blue"
                  variant="outline"
                  w="full"
                  mb={6}
                >
                  🔐 Manage Two-Factor Authentication
                </Button>
              </Box>

              <Box borderTopWidth="1px" pt={6} mt={4}>
                <Heading size="md" mb={4}>
                  Change Password (Optional)
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Leave blank if you don't want to change your password
                </Text>

                <VStack gap={4} align="stretch">
                  <FormControl>
                    <FormLabel>Current Password</FormLabel>
                    <Input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, currentPassword: e.target.value })
                      }
                      placeholder="Enter current password"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="At least 6 characters"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      placeholder="Re-enter new password"
                    />
                  </FormControl>
                </VStack>
              </Box>

              <Button
                type="submit"
                colorScheme="purple"
                isLoading={loading}
                loadingText="Updating..."
                w="full"
                mt={4}
                size="lg"
              >
                Update Profile
              </Button>
            </VStack>
          </form>
        </Card.Root>
      </Container>
    </Box>
  );
};

export default Profile;
