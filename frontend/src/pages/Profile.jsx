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
  Badge,
  Text,
  useToast,
  Avatar,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { authAPI, dailyUpdateAPI, weeklyUpdateAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const Profile = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, setUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [stats, setStats] = useState({
    dailyCount: 0,
    weeklyCount: 0,
    recentActivity: [],
  });
  const [avatarPreview, setAvatarPreview] = useState(null);

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

  useEffect(() => {
    const fetchUserStats = async () => {
      setStatsLoading(true);
      try {
        // Fetch daily and weekly updates
        const [dailyResponse, weeklyResponse] = await Promise.all([
          dailyUpdateAPI.getAll(),
          weeklyUpdateAPI.getAll(),
        ]);

        const dailyUpdates = dailyResponse.data.data || [];
        const weeklyUpdates = weeklyResponse.data.data || [];

        // Combine and sort by date for recent activity
        const allUpdates = [
          ...dailyUpdates.map(u => ({ ...u, type: 'daily' })),
          ...weeklyUpdates.map(u => ({ ...u, type: 'weekly' })),
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setStats({
          dailyCount: dailyUpdates.length,
          weeklyCount: weeklyUpdates.length,
          recentActivity: allUpdates.slice(0, 10),
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Avatar image must be less than 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);

      toast({
        title: 'Avatar preview loaded',
        description: 'Avatar upload will be available soon',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
      <Container maxW="4xl" py={8}>
        <VStack gap={6} align="stretch">
          {/* Avatar and User Info Section */}
          <Card p={6}>
            <HStack gap={6}>
              <VStack>
                <Avatar
                  size="2xl"
                  name={user?.name}
                  src={avatarPreview}
                  bg="purple.500"
                  color="white"
                />
                <Button
                  size="sm"
                  variant="link"
                  colorScheme="purple"
                  as="label"
                  cursor="pointer"
                >
                  Change Avatar
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    display="none"
                  />
                </Button>
              </VStack>
              <VStack align="start" flex={1} gap={2}>
                <Heading size="lg">{user?.name}</Heading>
                <Text color="gray.600">{user?.email}</Text>
                {user?.emailVerified ? (
                  <Badge colorScheme="green">Email Verified</Badge>
                ) : (
                  <Badge colorScheme="orange">Email Not Verified</Badge>
                )}
                <Text fontSize="sm" color="gray.500">
                  Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'N/A'}
                </Text>
              </VStack>
            </HStack>
          </Card>

          {/* Tabbed Interface */}
          <Card>
            <Tabs colorScheme="purple">
              <TabList px={6} pt={6}>
                <Tab>Account Settings</Tab>
                <Tab>Statistics & Activity</Tab>
              </TabList>

              <TabPanels>
                {/* Tab 1: Account Settings */}
                <TabPanel>
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
                  Integrations
                </Heading>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Connect your favorite communication tools
                </Text>
                <Button
                  onClick={() => navigate('/integrations')}
                  colorScheme="purple"
                  variant="outline"
                  w="full"
                  mb={6}
                >
                  🔗 Manage Integrations (Telegram, Google Chat)
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
                </TabPanel>

                {/* Tab 2: Statistics & Activity */}
                <TabPanel>
                  <VStack gap={6} align="stretch">
                    <Box>
                      <Heading size="md" mb={4}>
                        Usage Statistics
                      </Heading>
                      {statsLoading ? (
                        <Text color="gray.500">Loading statistics...</Text>
                      ) : (
                        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                          <Card p={6} bg="purple.50" borderColor="purple.200" borderWidth="1px">
                            <Stat>
                              <StatLabel color="purple.700">Daily Updates</StatLabel>
                              <StatNumber fontSize="3xl" color="purple.600">
                                {stats.dailyCount}
                              </StatNumber>
                              <StatHelpText color="purple.600">
                                Total updates submitted
                              </StatHelpText>
                            </Stat>
                          </Card>

                          <Card p={6} bg="blue.50" borderColor="blue.200" borderWidth="1px">
                            <Stat>
                              <StatLabel color="blue.700">Weekly Summaries</StatLabel>
                              <StatNumber fontSize="3xl" color="blue.600">
                                {stats.weeklyCount}
                              </StatNumber>
                              <StatHelpText color="blue.600">
                                Total summaries created
                              </StatHelpText>
                            </Stat>
                          </Card>
                        </SimpleGrid>
                      )}
                    </Box>

                    <Divider />

                    <Box>
                      <Heading size="md" mb={4}>
                        Recent Activity
                      </Heading>
                      {statsLoading ? (
                        <Text color="gray.500">Loading activity...</Text>
                      ) : stats.recentActivity.length === 0 ? (
                        <Text color="gray.500">No recent activity</Text>
                      ) : (
                        <List spacing={3}>
                          {stats.recentActivity.map((activity, index) => (
                            <ListItem
                              key={activity._id || index}
                              p={3}
                              bg="gray.50"
                              borderRadius="md"
                              borderWidth="1px"
                            >
                              <HStack justify="space-between">
                                <VStack align="start" gap={1}>
                                  <HStack>
                                    <Badge colorScheme={activity.type === 'daily' ? 'purple' : 'blue'}>
                                      {activity.type === 'daily' ? 'Daily Update' : 'Weekly Summary'}
                                    </Badge>
                                    <Text fontSize="sm" fontWeight="medium">
                                      {format(new Date(activity.createdAt), 'MMM dd, yyyy')}
                                    </Text>
                                  </HStack>
                                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                                    {activity.achievements?.slice(0, 100) || activity.summary?.slice(0, 100) || 'No description'}
                                    {(activity.achievements?.length > 100 || activity.summary?.length > 100) && '...'}
                                  </Text>
                                </VStack>
                                <IconButton
                                  icon="👁️"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => navigate('/history')}
                                  aria-label="View details"
                                />
                              </HStack>
                            </ListItem>
                          ))}
                        </List>
                      )}
                      {stats.recentActivity.length > 0 && (
                        <Button
                          onClick={() => navigate('/history')}
                          variant="link"
                          colorScheme="purple"
                          mt={4}
                          w="full"
                        >
                          View All Activity →
                        </Button>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
};

export default Profile;
