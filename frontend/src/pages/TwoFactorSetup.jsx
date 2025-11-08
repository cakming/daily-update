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
  Text,
  Input,
  
  Alert,
  Code,
  SimpleGrid,
  FormControl,
  FormLabel,
  Flex,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { authAPI } from '../services/api';

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await authAPI.get2FAStatus();
      setTwoFactorEnabled(response.data.data.twoFactorEnabled);
      if (response.data.data.twoFactorEnabled) {
        setStep(4); // Already enabled
      }
    } catch (error) {
      console.error('Error checking 2FA status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSetup = async () => {
    setLoading(true);
    try {
      const response = await authAPI.setup2FA();
      setQrCode(response.data.data.qrCode);
      setSecret(response.data.data.secret);
      setStep(2);
      toast({
        title: 'QR code generated',
        description: 'Scan this code with your authenticator app',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Setup failed',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token || token.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit code from your authenticator app',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verify2FA({ token });
      setBackupCodes(response.data.data.backupCodes);
      setStep(3);
      toast({
        title: '2FA enabled successfully',
        description: 'Save your backup codes in a safe place',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Verification failed',
        description: error.response?.data?.message || 'Invalid code. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    if (!password) return;

    setLoading(true);
    try {
      await authAPI.disable2FA({ password });
      toast({
        title: '2FA disabled',
        description: 'Two-factor authentication has been disabled',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setTwoFactorEnabled(false);
      setStep(1);
    } catch (error) {
      toast({
        title: 'Failed to disable 2FA',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    toast({
      title: 'Copied to clipboard',
      description: 'Backup codes have been copied',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (checkingStatus) {
    return (
      <Box minH="100vh" bg="gray.50" py={8}>
        <Container maxW="2xl">
          <Card.Root p={8}>
            <Text textAlign="center">Loading...</Text>
          </Card.Root>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" py={8}>
      <Container maxW="2xl">
        <Card.Root p={8}>
          <VStack gap={6} align="stretch">
            <HStack justify="space-between">
              <Heading size="lg">Two-Factor Authentication</Heading>
              <Badge colorScheme={twoFactorEnabled ? 'green' : 'gray'}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </HStack>

            {/* Step 1: Introduction */}
            {step === 1 && (
              <VStack gap={4} align="stretch">
                <Alert.Root status="info">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Secure Your Account</Alert.Title>
                    <Alert.Description>
                      Add an extra layer of security by enabling two-factor authentication (2FA)
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>

                <Text>
                  Two-factor authentication adds an additional layer of security to your account by
                  requiring more than just a password to log in.
                </Text>

                <Box bg="gray.50" p={4} borderRadius="md">
                  <Heading size="sm" mb={2}>
                    What you'll need:
                  </Heading>
                  <VStack align="start" gap={2}>
                    <Text fontSize="sm">• An authenticator app (Google Authenticator, Authy, etc.)</Text>
                    <Text fontSize="sm">• Your smartphone or tablet</Text>
                    <Text fontSize="sm">• A secure place to store backup codes</Text>
                  </VStack>
                </Box>

                <Button
                  onClick={handleSetup}
                  colorScheme="blue"
                  isLoading={loading}
                  size="lg"
                  mt={4}
                >
                  Enable 2FA
                </Button>

                <Button
                  onClick={() => navigate('/profile')}
                  variant="outline"
                >
                  Back to Profile
                </Button>
              </VStack>
            )}

            {/* Step 2: Scan QR Code */}
            {step === 2 && (
              <VStack gap={4} align="stretch">
                <Alert.Root status="info">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Step 1: Scan QR Code</Alert.Title>
                    <Alert.Description>
                      Use your authenticator app to scan this QR code
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>

                <Flex justify="center" my={4}>
                  {qrCode && (
                    <Box borderWidth="4px" borderColor="white" borderRadius="lg" p={2} bg="white">
                      <img src={qrCode} alt="QR Code" style={{ width: '250px', height: '250px' }} />
                    </Box>
                  )}
                </Flex>

                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" mb={2}>
                    Can't scan the QR code?
                  </Text>
                  <Text fontSize="sm" mb={2}>
                    Enter this code manually in your authenticator app:
                  </Text>
                  <Code p={2} fontSize="md" w="full" textAlign="center">
                    {secret}
                  </Code>
                </Box>

                <FormControl>
                  <FormLabel>Enter the 6-digit code from your app</FormLabel>
                  <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    size="lg"
                    textAlign="center"
                    fontSize="2xl"
                    maxLength={6}
                  />
                </FormControl>

                <HStack>
                  <Button
                    onClick={handleVerify}
                    colorScheme="blue"
                    isLoading={loading}
                    flex={1}
                    isDisabled={token.length !== 6}
                  >
                    Verify & Enable
                  </Button>
                  <Button
                    onClick={() => {
                      setStep(1);
                      setToken('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            )}

            {/* Step 3: Backup Codes */}
            {step === 3 && (
              <VStack gap={4} align="stretch">
                <Alert.Root status="success">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>2FA Enabled Successfully!</Alert.Title>
                    <Alert.Description>
                      Save these backup codes in a secure location
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>

                <Box bg="yellow.50" p={4} borderRadius="md" borderWidth="1px" borderColor="yellow.200">
                  <Text fontWeight="bold" color="yellow.800" mb={2}>
                    ⚠️ Important: Save Your Backup Codes
                  </Text>
                  <Text fontSize="sm" color="yellow.800">
                    Each code can only be used once. Keep them in a safe place in case you lose
                    access to your authenticator app.
                  </Text>
                </Box>

                <SimpleGrid columns={2} gap={2} p={4} bg="gray.50" borderRadius="md">
                  {backupCodes.map((code, index) => (
                    <Code key={index} p={2} fontSize="md" textAlign="center">
                      {code}
                    </Code>
                  ))}
                </SimpleGrid>

                <HStack>
                  <Button onClick={copyBackupCodes} flex={1} colorScheme="blue" variant="outline">
                    Copy Codes
                  </Button>
                  <Button onClick={downloadBackupCodes} flex={1} colorScheme="blue" variant="outline">
                    Download Codes
                  </Button>
                </HStack>

                <Button onClick={() => navigate('/profile')} colorScheme="green" size="lg">
                  Done
                </Button>
              </VStack>
            )}

            {/* Step 4: Already Enabled */}
            {step === 4 && (
              <VStack gap={4} align="stretch">
                <Alert.Root status="success">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>2FA is Active</Alert.Title>
                    <Alert.Description>
                      Your account is protected with two-factor authentication
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>

                <Box bg="gray.50" p={4} borderRadius="md">
                  <Text fontSize="sm">
                    Two-factor authentication is currently enabled for your account. You'll need to
                    enter a code from your authenticator app each time you log in.
                  </Text>
                </Box>

                <Alert.Root status="warning">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>Disable 2FA</Alert.Title>
                    <Alert.Description>
                      Disabling 2FA will make your account less secure. You'll only need your
                      password to log in.
                    </Alert.Description>
                  </Alert.Content>
                </Alert.Root>

                <HStack>
                  <Button onClick={() => navigate('/profile')} flex={1}>
                    Back to Profile
                  </Button>
                  <Button
                    onClick={handleDisable2FA}
                    colorScheme="red"
                    variant="outline"
                    isLoading={loading}
                  >
                    Disable 2FA
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>
        </Card.Root>
      </Container>
    </Box>
  );
};

export default TwoFactorSetup;
