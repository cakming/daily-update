import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  Input,
  Button,
  Text,
  useToast,
  Card,
  FormControl,
  FormLabel,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, register, isAuthenticated } = useAuth();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(
      loginData.email,
      loginData.password,
      require2FA ? (useBackupCode ? null : twoFactorToken) : null,
      require2FA && useBackupCode ? twoFactorToken : null
    );

    if (result.success && !result.require2FA) {
      toast({
        title: 'Login successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } else if (result.require2FA) {
      setRequire2FA(true);
      toast({
        title: '2FA Required',
        description: 'Please enter your authentication code',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Login failed',
        description: result.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await register(registerData.name, registerData.email, registerData.password);

    if (result.success) {
      toast({
        title: 'Registration successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Registration failed',
        description: result.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    setLoading(false);
  };

  return (
    <Box minH="100vh" bg="gray.50" py={20}>
      <Container maxW="md">
        <VStack gap={8}>
          <Heading size="2xl" color="blue.600">
            Daily Update App
          </Heading>

          <Card.Root w="full" p={8}>
            <Tabs.Root defaultValue="login">
              <TabList>
                <Tabs.Trigger value="login">Login</Tabs.Trigger>
                <Tabs.Trigger value="register">Register</Tabs.Trigger>
              </TabList>

              <TabPanels>
                <TabPanel value="login">
                  <form onSubmit={handleLogin}>
                    <VStack gap={4}>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={loginData.email}
                          onChange={(e) =>
                            setLoginData({ ...loginData, email: e.target.value })
                          }
                          placeholder="your@email.com"
                          isDisabled={require2FA}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({ ...loginData, password: e.target.value })
                          }
                          placeholder="••••••••"
                          isDisabled={require2FA}
                        />
                      </FormControl>

                      {require2FA && (
                        <Box w="full" bg="blue.50" p={4} borderRadius="md">
                          <VStack gap={3} align="stretch">
                            <Text fontSize="sm" fontWeight="bold" color="blue.800">
                              🔐 Two-Factor Authentication Required
                            </Text>
                            <Text fontSize="sm" color="blue.700">
                              {useBackupCode
                                ? 'Enter one of your backup codes'
                                : 'Enter the 6-digit code from your authenticator app'}
                            </Text>
                            <Input
                              value={twoFactorToken}
                              onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, useBackupCode ? 8 : 6))}
                              placeholder={useBackupCode ? 'XXXXXXXX' : '000000'}
                              size="lg"
                              textAlign="center"
                              fontSize="xl"
                              maxLength={useBackupCode ? 8 : 6}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setUseBackupCode(!useBackupCode);
                                setTwoFactorToken('');
                              }}
                            >
                              {useBackupCode ? 'Use authenticator app instead' : 'Use backup code instead'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRequire2FA(false);
                                setTwoFactorToken('');
                                setUseBackupCode(false);
                              }}
                            >
                              ← Back to login
                            </Button>
                          </VStack>
                        </Box>
                      )}

                      {!require2FA && (
                        <Text fontSize="sm" alignSelf="flex-end">
                          <Link to="/forgot-password" style={{ color: '#3182CE', textDecoration: 'underline' }}>
                            Forgot Password?
                          </Link>
                        </Text>
                      )}

                      <Button
                        type="submit"
                        colorScheme="blue"
                        w="full"
                        loading={loading}
                        mt={4}
                        isDisabled={require2FA && !twoFactorToken}
                      >
                        {require2FA ? 'Verify & Login' : 'Login'}
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                <TabPanel value="register">
                  <form onSubmit={handleRegister}>
                    <VStack gap={4}>
                      <FormControl isRequired>
                        <FormLabel>Name</FormLabel>
                        <Input
                          type="text"
                          value={registerData.name}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, name: e.target.value })
                          }
                          placeholder="Your name"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={registerData.email}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, email: e.target.value })
                          }
                          placeholder="your@email.com"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={registerData.password}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, password: e.target.value })
                          }
                          placeholder="••••••••"
                          minLength={6}
                        />
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          At least 6 characters
                        </Text>
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="blue"
                        w="full"
                        loading={loading}
                        mt={4}
                      >
                        Register
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs.Root>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
};

export default Login;
