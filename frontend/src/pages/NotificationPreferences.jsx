import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Switch,
  FormControl,
  FormLabel,
  
  Divider,
  Input,
  Select,
  SimpleGrid,
  Badge,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Notification Preferences Page
 * Comprehensive notification settings management
 */
const NotificationPreferences = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState({
    emailNotifications: {
      enabled: true,
      dailyDigest: false,
      weeklyDigest: true,
      systemAlerts: true,
      updateReminders: true,
    },
    inAppNotifications: {
      enabled: true,
      systemNotifications: true,
      updateNotifications: true,
      reminderNotifications: true,
      achievementNotifications: true,
    },
    botNotifications: {
      telegram: true,
      googleChat: true,
      sendOnCreate: false,
      sendDailySummary: false,
      sendWeeklySummary: true,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'UTC',
    },
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get(`${API_BASE_URL}/notification-preferences`, config);
      setPreferences(response.data.data);
    } catch (error) {
      toast({
        title: 'Failed to load preferences',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`${API_BASE_URL}/notification-preferences`, preferences, config);

      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to save preferences',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all notification preferences to default?')) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post(
        `${API_BASE_URL}/notification-preferences/reset`,
        {},
        config
      );

      setPreferences(response.data.data);

      toast({
        title: 'Preferences reset',
        description: 'All notification preferences have been reset to default',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to reset preferences',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (category, field, value) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="7xl" py={8}>
          <Text>Loading preferences...</Text>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="blue.600">
              🔔 Notification Preferences
            </Heading>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.lg" py={8}>
        <VStack gap={6} align="stretch">
          {/* Info Alert */}
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text fontSize="sm">
              Customize how and when you receive notifications. Changes are saved automatically.
            </Text>
          </Alert>

          {/* Email Notifications */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <HStack justify="space-between" w="full">
                <VStack align="start" gap={1}>
                  <Heading size="md">📧 Email Notifications</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Receive notifications via email
                  </Text>
                </VStack>
                <Switch
                  isChecked={preferences.emailNotifications.enabled}
                  onChange={(e) =>
                    updatePreference('emailNotifications', 'enabled', e.target.checked)
                  }
                  size="lg"
                  colorScheme="blue"
                />
              </HStack>

              <Divider />

              {preferences.emailNotifications.enabled && (
                <VStack align="stretch" w="full" gap={3}>
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0}>Daily Digest</FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        Receive a daily summary of your updates
                      </Text>
                    </Box>
                    <Switch
                      isChecked={preferences.emailNotifications.dailyDigest}
                      onChange={(e) =>
                        updatePreference('emailNotifications', 'dailyDigest', e.target.checked)
                      }
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0}>Weekly Digest</FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        Receive a weekly summary of your activity
                      </Text>
                    </Box>
                    <Switch
                      isChecked={preferences.emailNotifications.weeklyDigest}
                      onChange={(e) =>
                        updatePreference('emailNotifications', 'weeklyDigest', e.target.checked)
                      }
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0}>System Alerts</FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        Important system notifications and announcements
                      </Text>
                    </Box>
                    <Switch
                      isChecked={preferences.emailNotifications.systemAlerts}
                      onChange={(e) =>
                        updatePreference('emailNotifications', 'systemAlerts', e.target.checked)
                      }
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0}>Update Reminders</FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        Reminders to create your daily updates
                      </Text>
                    </Box>
                    <Switch
                      isChecked={preferences.emailNotifications.updateReminders}
                      onChange={(e) =>
                        updatePreference('emailNotifications', 'updateReminders', e.target.checked)
                      }
                    />
                  </FormControl>
                </VStack>
              )}
            </VStack>
          </Card.Root>

          {/* In-App Notifications */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <HStack justify="space-between" w="full">
                <VStack align="start" gap={1}>
                  <Heading size="md">🔔 In-App Notifications</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Receive notifications within the app
                  </Text>
                </VStack>
                <Switch
                  isChecked={preferences.inAppNotifications.enabled}
                  onChange={(e) =>
                    updatePreference('inAppNotifications', 'enabled', e.target.checked)
                  }
                  size="lg"
                  colorScheme="blue"
                />
              </HStack>

              <Divider />

              {preferences.inAppNotifications.enabled && (
                <VStack align="stretch" w="full" gap={3}>
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0}>System Notifications</FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        System updates and announcements
                      </Text>
                    </Box>
                    <Switch
                      isChecked={preferences.inAppNotifications.systemNotifications}
                      onChange={(e) =>
                        updatePreference(
                          'inAppNotifications',
                          'systemNotifications',
                          e.target.checked
                        )
                      }
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0}>Update Notifications</FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        When updates are created or modified
                      </Text>
                    </Box>
                    <Switch
                      isChecked={preferences.inAppNotifications.updateNotifications}
                      onChange={(e) =>
                        updatePreference(
                          'inAppNotifications',
                          'updateNotifications',
                          e.target.checked
                        )
                      }
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0}>Reminder Notifications</FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        Reminders and scheduled notifications
                      </Text>
                    </Box>
                    <Switch
                      isChecked={preferences.inAppNotifications.reminderNotifications}
                      onChange={(e) =>
                        updatePreference(
                          'inAppNotifications',
                          'reminderNotifications',
                          e.target.checked
                        )
                      }
                    />
                  </FormControl>

                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <FormLabel mb={0}>Achievement Notifications</FormLabel>
                      <Text fontSize="xs" color="gray.600">
                        Milestones and achievements
                      </Text>
                    </Box>
                    <Switch
                      isChecked={preferences.inAppNotifications.achievementNotifications}
                      onChange={(e) =>
                        updatePreference(
                          'inAppNotifications',
                          'achievementNotifications',
                          e.target.checked
                        )
                      }
                    />
                  </FormControl>
                </VStack>
              )}
            </VStack>
          </Card.Root>

          {/* Bot Notifications */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <VStack align="start" gap={1} w="full">
                <Heading size="md">🤖 Bot Notifications</Heading>
                <Text fontSize="sm" color="gray.600">
                  Send notifications to Telegram and Google Chat
                </Text>
              </VStack>

              <Divider />

              <VStack align="stretch" w="full" gap={3}>
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0}>Telegram Notifications</FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      Send notifications to your Telegram bot
                    </Text>
                  </Box>
                  <Switch
                    isChecked={preferences.botNotifications.telegram}
                    onChange={(e) =>
                      updatePreference('botNotifications', 'telegram', e.target.checked)
                    }
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0}>Google Chat Notifications</FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      Send notifications to your Google Chat space
                    </Text>
                  </Box>
                  <Switch
                    isChecked={preferences.botNotifications.googleChat}
                    onChange={(e) =>
                      updatePreference('botNotifications', 'googleChat', e.target.checked)
                    }
                  />
                </FormControl>

                <Divider />

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0}>Send on Update Create</FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      Instant notification when you create an update
                    </Text>
                  </Box>
                  <Switch
                    isChecked={preferences.botNotifications.sendOnCreate}
                    onChange={(e) =>
                      updatePreference('botNotifications', 'sendOnCreate', e.target.checked)
                    }
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0}>Daily Summary</FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      End-of-day summary to your bots
                    </Text>
                  </Box>
                  <Switch
                    isChecked={preferences.botNotifications.sendDailySummary}
                    onChange={(e) =>
                      updatePreference('botNotifications', 'sendDailySummary', e.target.checked)
                    }
                  />
                </FormControl>

                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0}>Weekly Summary</FormLabel>
                    <Text fontSize="xs" color="gray.600">
                      Weekly recap to your bots
                    </Text>
                  </Box>
                  <Switch
                    isChecked={preferences.botNotifications.sendWeeklySummary}
                    onChange={(e) =>
                      updatePreference('botNotifications', 'sendWeeklySummary', e.target.checked)
                    }
                  />
                </FormControl>
              </VStack>
            </VStack>
          </Card.Root>

          {/* Quiet Hours */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <HStack justify="space-between" w="full">
                <VStack align="start" gap={1}>
                  <Heading size="md">🌙 Quiet Hours</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Pause notifications during specific hours
                  </Text>
                </VStack>
                <Switch
                  isChecked={preferences.quietHours.enabled}
                  onChange={(e) => updatePreference('quietHours', 'enabled', e.target.checked)}
                  size="lg"
                  colorScheme="blue"
                />
              </HStack>

              <Divider />

              {preferences.quietHours.enabled && (
                <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} w="full">
                  <FormControl>
                    <FormLabel fontSize="sm">Start Time</FormLabel>
                    <Input
                      type="time"
                      value={preferences.quietHours.startTime}
                      onChange={(e) =>
                        updatePreference('quietHours', 'startTime', e.target.value)
                      }
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">End Time</FormLabel>
                    <Input
                      type="time"
                      value={preferences.quietHours.endTime}
                      onChange={(e) => updatePreference('quietHours', 'endTime', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm">Timezone</FormLabel>
                    <Select
                      value={preferences.quietHours.timezone}
                      onChange={(e) => updatePreference('quietHours', 'timezone', e.target.value)}
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Singapore">Singapore</option>
                    </Select>
                  </FormControl>
                </SimpleGrid>
              )}
            </VStack>
          </Card.Root>

          {/* Action Buttons */}
          <HStack justify="space-between">
            <Button onClick={handleReset} variant="outline" colorScheme="red">
              Reset to Default
            </Button>
            <Button onClick={handleSave} colorScheme="blue" isLoading={saving}>
              Save Preferences
            </Button>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default NotificationPreferences;
