import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Card,
  Badge,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Divider,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Integrations Page
 * Manage third-party integrations (Telegram, Google Chat)
 */
const Integrations = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Telegram state
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const [telegramIdInput, setTelegramIdInput] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);

  // Google Chat state
  const [googleChatLinked, setGoogleChatLinked] = useState(false);
  const [googleChatWebhook, setGoogleChatWebhook] = useState('');
  const [googleChatWebhookInput, setGoogleChatWebhookInput] = useState('');
  const [googleChatLoading, setGoogleChatLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [telegramRes, googleChatRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/integrations/telegram/status`, config),
        axios.get(`${API_BASE_URL}/integrations/googlechat/status`, config),
      ]);

      setTelegramLinked(telegramRes.data.data.linked);
      setTelegramId(telegramRes.data.data.telegramId || '');

      setGoogleChatLinked(googleChatRes.data.data.linked);
      setGoogleChatWebhook(googleChatRes.data.data.webhookUrl || '');
    } catch (error) {
      toast({
        title: 'Failed to load integration status',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Telegram functions
  const handleLinkTelegram = async () => {
    if (!telegramIdInput.trim()) {
      toast({
        title: 'Telegram ID required',
        description: 'Please enter your Telegram ID',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setTelegramLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(
        `${API_BASE_URL}/integrations/telegram/link`,
        { telegramId: telegramIdInput },
        config
      );

      toast({
        title: 'Telegram linked successfully',
        description: 'Check your Telegram for a confirmation message',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setTelegramIdInput('');
      await fetchIntegrationStatus();
    } catch (error) {
      toast({
        title: 'Failed to link Telegram',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleUnlinkTelegram = async () => {
    if (!window.confirm('Are you sure you want to unlink your Telegram account?')) return;

    try {
      setTelegramLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${API_BASE_URL}/integrations/telegram/unlink`, config);

      toast({
        title: 'Telegram unlinked',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await fetchIntegrationStatus();
    } catch (error) {
      toast({
        title: 'Failed to unlink Telegram',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    try {
      setTelegramLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_BASE_URL}/integrations/telegram/test`, {}, config);

      toast({
        title: 'Test message sent',
        description: 'Check your Telegram for the test message',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to send test message',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  // Google Chat functions
  const handleLinkGoogleChat = async () => {
    if (!googleChatWebhookInput.trim()) {
      toast({
        title: 'Webhook URL required',
        description: 'Please enter your Google Chat webhook URL',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setGoogleChatLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(
        `${API_BASE_URL}/integrations/googlechat/link`,
        { webhookUrl: googleChatWebhookInput },
        config
      );

      toast({
        title: 'Google Chat linked successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      setGoogleChatWebhookInput('');
      await fetchIntegrationStatus();
    } catch (error) {
      toast({
        title: 'Failed to link Google Chat',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGoogleChatLoading(false);
    }
  };

  const handleUnlinkGoogleChat = async () => {
    if (!window.confirm('Are you sure you want to unlink your Google Chat webhook?')) return;

    try {
      setGoogleChatLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${API_BASE_URL}/integrations/googlechat/unlink`, config);

      toast({
        title: 'Google Chat unlinked',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      await fetchIntegrationStatus();
    } catch (error) {
      toast({
        title: 'Failed to unlink Google Chat',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGoogleChatLoading(false);
    }
  };

  const handleTestGoogleChat = async () => {
    try {
      setGoogleChatLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_BASE_URL}/integrations/googlechat/test`, {}, config);

      toast({
        title: 'Test message sent',
        description: 'Check your Google Chat space for the test message',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to send test message',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGoogleChatLoading(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="7xl" py={8}>
          <Text>Loading integrations...</Text>
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
              🔗 Integrations
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
          <Box>
            <Heading size="md" mb={2}>
              Connect Your Apps
            </Heading>
            <Text color="gray.600">
              Integrate Daily Update with your favorite communication tools
            </Text>
          </Box>

          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>🤖 Telegram Bot</Tab>
              <Tab>💬 Google Chat</Tab>
            </TabList>

            <TabPanels>
              {/* Telegram Tab */}
              <TabPanel>
                <VStack gap={6} align="stretch">
                  <Card.Root p={6}>
                    <VStack align="start" gap={4}>
                      <HStack justify="space-between" w="full">
                        <VStack align="start" gap={1}>
                          <Heading size="md">Telegram Bot</Heading>
                          <Badge colorScheme={telegramLinked ? 'green' : 'gray'}>
                            {telegramLinked ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </VStack>
                      </HStack>

                      <Text fontSize="sm" color="gray.600">
                        Connect your Telegram account to receive updates and interact with your daily updates through our bot.
                      </Text>

                      <Divider />

                      {telegramLinked ? (
                        <VStack align="stretch" gap={4} w="full">
                          <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <AlertTitle>Connected</AlertTitle>
                              <AlertDescription fontSize="sm">
                                Your Telegram account is linked. Telegram ID: <Code>{telegramId}</Code>
                              </AlertDescription>
                            </Box>
                          </Alert>

                          <VStack align="stretch" gap={3}>
                            <Text fontWeight="bold" fontSize="sm">
                              Available Bot Commands:
                            </Text>
                            <Box fontSize="sm" fontFamily="mono" bg="gray.50" p={3} borderRadius="md">
                              <Text>/today - Get today's updates</Text>
                              <Text>/week - Get this week's summary</Text>
                              <Text>/stats - View your statistics</Text>
                              <Text>/latest - Get your latest update</Text>
                              <Text>/help - Show all commands</Text>
                            </Box>
                          </VStack>

                          <HStack gap={3}>
                            <Button
                              onClick={handleTestTelegram}
                              isLoading={telegramLoading}
                              colorScheme="blue"
                            >
                              Send Test Message
                            </Button>
                            <Button
                              onClick={handleUnlinkTelegram}
                              isLoading={telegramLoading}
                              colorScheme="red"
                              variant="outline"
                            >
                              Disconnect
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <VStack align="stretch" gap={4} w="full">
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <AlertTitle fontSize="sm">How to Connect</AlertTitle>
                              <AlertDescription fontSize="xs">
                                1. Search for our bot on Telegram: <Code>@DailyUpdateBot</Code>
                                <br />
                                2. Start a chat and use the <Code>/link</Code> command
                                <br />
                                3. Copy your Telegram ID from the bot's response
                                <br />
                                4. Paste it below and click "Connect"
                              </AlertDescription>
                            </Box>
                          </Alert>

                          <VStack align="stretch" gap={2}>
                            <Text fontSize="sm" fontWeight="bold">
                              Telegram ID:
                            </Text>
                            <HStack>
                              <Input
                                placeholder="Enter your Telegram ID"
                                value={telegramIdInput}
                                onChange={(e) => setTelegramIdInput(e.target.value)}
                                size="lg"
                              />
                              <Button
                                onClick={handleLinkTelegram}
                                isLoading={telegramLoading}
                                colorScheme="blue"
                                size="lg"
                              >
                                Connect
                              </Button>
                            </HStack>
                          </VStack>
                        </VStack>
                      )}
                    </VStack>
                  </Card.Root>
                </VStack>
              </TabPanel>

              {/* Google Chat Tab */}
              <TabPanel>
                <VStack gap={6} align="stretch">
                  <Card.Root p={6}>
                    <VStack align="start" gap={4}>
                      <HStack justify="space-between" w="full">
                        <VStack align="start" gap={1}>
                          <Heading size="md">Google Chat</Heading>
                          <Badge colorScheme={googleChatLinked ? 'green' : 'gray'}>
                            {googleChatLinked ? 'Connected' : 'Not Connected'}
                          </Badge>
                        </VStack>
                      </HStack>

                      <Text fontSize="sm" color="gray.600">
                        Send your updates to Google Chat spaces using incoming webhooks.
                      </Text>

                      <Divider />

                      {googleChatLinked ? (
                        <VStack align="stretch" gap={4} w="full">
                          <Alert status="success" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <AlertTitle>Connected</AlertTitle>
                              <AlertDescription fontSize="sm">
                                Your Google Chat webhook is configured: <Code fontSize="xs">{googleChatWebhook}</Code>
                              </AlertDescription>
                            </Box>
                          </Alert>

                          <Text fontSize="sm" color="gray.600">
                            Updates can now be sent to your Google Chat space with rich formatting and interactive cards.
                          </Text>

                          <HStack gap={3}>
                            <Button
                              onClick={handleTestGoogleChat}
                              isLoading={googleChatLoading}
                              colorScheme="blue"
                            >
                              Send Test Message
                            </Button>
                            <Button
                              onClick={handleUnlinkGoogleChat}
                              isLoading={googleChatLoading}
                              colorScheme="red"
                              variant="outline"
                            >
                              Disconnect
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        <VStack align="stretch" gap={4} w="full">
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <Box>
                              <AlertTitle fontSize="sm">How to Connect</AlertTitle>
                              <AlertDescription fontSize="xs">
                                1. Open your Google Chat space
                                <br />
                                2. Click on the space name → Apps & integrations → Webhooks
                                <br />
                                3. Create an incoming webhook
                                <br />
                                4. Copy the webhook URL
                                <br />
                                5. Paste it below and click "Connect"
                              </AlertDescription>
                            </Box>
                          </Alert>

                          <VStack align="stretch" gap={2}>
                            <Text fontSize="sm" fontWeight="bold">
                              Webhook URL:
                            </Text>
                            <VStack align="stretch" gap={2}>
                              <Input
                                placeholder="https://chat.googleapis.com/v1/spaces/..."
                                value={googleChatWebhookInput}
                                onChange={(e) => setGoogleChatWebhookInput(e.target.value)}
                                size="lg"
                                type="url"
                              />
                              <Button
                                onClick={handleLinkGoogleChat}
                                isLoading={googleChatLoading}
                                colorScheme="blue"
                                size="lg"
                                w="full"
                              >
                                Connect
                              </Button>
                            </VStack>
                          </VStack>
                        </VStack>
                      )}
                    </VStack>
                  </Card.Root>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
};

export default Integrations;
