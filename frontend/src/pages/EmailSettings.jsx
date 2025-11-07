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
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { emailAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * Email Settings Page
 * Manage email configuration and send test emails
 */
const EmailSettings = () => {
  const [configured, setConfigured] = useState(false);
  const [configMessage, setConfigMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkEmailConfig();
  }, []);

  const checkEmailConfig = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getConfigStatus();
      setConfigured(response.data.data.configured);
      setConfigMessage(response.data.data.message);
    } catch (error) {
      toast({
        title: 'Failed to check email configuration',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Email required',
        description: 'Please enter an email address',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSending(true);
      await emailAPI.sendTestEmail({ email: testEmail });
      toast({
        title: 'Test email sent',
        description: `Check ${testEmail} for the test email`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setTestEmail('');
    } catch (error) {
      toast({
        title: 'Failed to send test email',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="blue.600">
              📧 Email Settings
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
          {/* Configuration Status */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <Heading size="md">Email Configuration Status</Heading>

              {loading ? (
                <Text color="gray.600">Checking configuration...</Text>
              ) : (
                <>
                  <HStack>
                    <Text fontWeight="bold">Status:</Text>
                    <Badge colorScheme={configured ? 'green' : 'red'} fontSize="md">
                      {configured ? 'Configured' : 'Not Configured'}
                    </Badge>
                  </HStack>

                  <Alert
                    status={configured ? 'success' : 'warning'}
                    borderRadius="md"
                  >
                    <AlertIcon />
                    <Box>
                      <AlertTitle>
                        {configured ? 'Email service is ready' : 'Email service not configured'}
                      </AlertTitle>
                      <AlertDescription fontSize="sm">
                        {configMessage}
                      </AlertDescription>
                    </Box>
                  </Alert>

                  {!configured && (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <Box>
                        <AlertTitle fontSize="sm">Configuration Required</AlertTitle>
                        <AlertDescription fontSize="xs">
                          To enable email functionality, please configure the following environment variables on the server:
                          <VStack align="start" mt={2} fontSize="xs" fontFamily="mono" gap={1}>
                            <Text>• EMAIL_HOST (e.g., smtp.gmail.com)</Text>
                            <Text>• EMAIL_PORT (e.g., 587)</Text>
                            <Text>• EMAIL_USER (your email address)</Text>
                            <Text>• EMAIL_PASS (your email password or app password)</Text>
                            <Text>• EMAIL_FROM (sender email address)</Text>
                            <Text>• EMAIL_FROM_NAME (sender name)</Text>
                          </VStack>
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </>
              )}

              <Button
                onClick={checkEmailConfig}
                isLoading={loading}
                size="sm"
                variant="outline"
              >
                Refresh Status
              </Button>
            </VStack>
          </Card.Root>

          {/* Send Test Email */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <Heading size="md">Send Test Email</Heading>

              <Text fontSize="sm" color="gray.600">
                Send a test email to verify your email configuration is working correctly.
              </Text>

              <HStack w="full">
                <Input
                  placeholder="recipient@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  type="email"
                  size="lg"
                  isDisabled={!configured}
                />
                <Button
                  onClick={handleSendTestEmail}
                  isLoading={sending}
                  colorScheme="blue"
                  size="lg"
                  isDisabled={!configured}
                >
                  Send Test
                </Button>
              </HStack>

              {!configured && (
                <Text fontSize="xs" color="gray.500">
                  Email must be configured before you can send test emails.
                </Text>
              )}
            </VStack>
          </Card.Root>

          <Divider />

          {/* Email Features Info */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <Heading size="md">Email Features</Heading>

              <VStack align="start" gap={3}>
                <Box>
                  <HStack mb={2}>
                    <Text fontWeight="bold">📝 Daily Updates</Text>
                    <Badge colorScheme="blue">Available</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Send your daily updates via email with professionally formatted templates.
                  </Text>
                </Box>

                <Box>
                  <HStack mb={2}>
                    <Text fontWeight="bold">📊 Weekly Summaries</Text>
                    <Badge colorScheme="green">Available</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Email weekly summaries to your team or clients with aggregated updates.
                  </Text>
                </Box>

                <Box>
                  <HStack mb={2}>
                    <Text fontWeight="bold">📧 Multiple Recipients</Text>
                    <Badge colorScheme="purple">Available</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Send updates to multiple recipients at once.
                  </Text>
                </Box>

                <Box>
                  <HStack mb={2}>
                    <Text fontWeight="bold">🎨 Formatted Templates</Text>
                    <Badge colorScheme="cyan">Available</Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    Emails are sent with beautiful HTML templates including your company branding, AI summaries, and tags.
                  </Text>
                </Box>
              </VStack>
            </VStack>
          </Card.Root>

          {/* How to Use */}
          <Card.Root p={6} bg="blue.50">
            <VStack align="start" gap={3}>
              <Heading size="sm">📖 How to Send Updates via Email</Heading>
              <VStack align="start" fontSize="sm" color="gray.700" gap={2}>
                <Text>1. Go to the History page to view your updates</Text>
                <Text>2. Click the "Email" button on any daily update or weekly summary</Text>
                <Text>3. Enter one or more recipient email addresses</Text>
                <Text>4. Click "Send Email" to deliver the update</Text>
                <Text mt={2} fontStyle="italic" color="gray.600">
                  Note: Email functionality must be configured by the administrator before use.
                </Text>
              </VStack>
            </VStack>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
};

export default EmailSettings;
