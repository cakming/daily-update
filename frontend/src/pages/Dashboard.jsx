import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  Button,
  HStack,
  Text,
  Card,
  SimpleGrid,
  Icon,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import ColorModeToggle from '../components/ColorModeToggle';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cards = [
    {
      title: 'Create Daily Update',
      description: 'Transform technical updates into client-friendly daily reports',
      icon: '📝',
      action: () => navigate('/daily-update/create'),
      color: 'blue',
    },
    {
      title: 'Generate Weekly Summary',
      description: 'Create a cohesive weekly report from daily updates',
      icon: '📊',
      action: () => navigate('/weekly-update/create'),
      color: 'green',
    },
    {
      title: 'View History',
      description: 'Browse and manage all past updates',
      icon: '📚',
      action: () => navigate('/history'),
      color: 'purple',
    },
    {
      title: 'Manage Companies',
      description: 'Organize updates by company or client',
      icon: '🏢',
      action: () => navigate('/companies'),
      color: 'orange',
    },
    {
      title: 'Update Templates',
      description: 'Create and manage reusable update templates',
      icon: '📋',
      action: () => navigate('/templates'),
      color: 'pink',
    },
    {
      title: 'Tags & Categories',
      description: 'Organize your updates with custom tags',
      icon: '🏷️',
      action: () => navigate('/tags'),
      color: 'cyan',
    },
    {
      title: 'View Analytics',
      description: 'Track your productivity and update trends',
      icon: '📈',
      action: () => navigate('/analytics'),
      color: 'teal',
    },
    {
      title: 'Profile Settings',
      description: 'Manage your account and security settings',
      icon: '⚙️',
      action: () => navigate('/profile'),
      color: 'gray',
    },
  ];

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <VStack align="start" gap={0}>
              <Heading size="lg" color="blue.600">
                Daily Update App
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Welcome back, {user?.name}!
              </Text>
            </VStack>
            <HStack>
              <ColorModeToggle />
              <Button onClick={handleLogout} variant="outline" colorScheme="red">
                Logout
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={12}>
        <VStack gap={8} align="stretch">
          <Box>
            <Heading size="xl" mb={2}>
              Dashboard
            </Heading>
            <Text color="gray.600">
              Choose an action to get started
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
            {cards.map((card, index) => (
              <Card.Root
                key={index}
                p={6}
                cursor="pointer"
                onClick={card.action}
                transition="all 0.2s"
                _hover={{
                  transform: 'translateY(-4px)',
                  shadow: 'lg',
                }}
              >
                <VStack align="start" gap={4}>
                  <Box fontSize="4xl">{card.icon}</Box>
                  <VStack align="start" gap={2}>
                    <Heading size="md" color={`${card.color}.600`}>
                      {card.title}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      {card.description}
                    </Text>
                  </VStack>
                  <Button
                    colorScheme={card.color}
                    variant="outline"
                    w="full"
                    mt={2}
                  >
                    Get Started
                  </Button>
                </VStack>
              </Card.Root>
            ))}
          </SimpleGrid>

          {/* Quick Stats */}
          <Card.Root p={6} mt={4}>
            <VStack align="start" gap={4}>
              <Heading size="md">Quick Tips</Heading>
              <VStack align="start" gap={2} pl={4}>
                <Text fontSize="sm" color="gray.700">
                  • Daily updates can be backdated or future-dated using the date picker
                </Text>
                <Text fontSize="sm" color="gray.700">
                  • Weekly summaries automatically aggregate daily updates from the selected date range
                </Text>
                <Text fontSize="sm" color="gray.700">
                  • All updates are saved to your history and can be edited or deleted later
                </Text>
                <Text fontSize="sm" color="gray.700">
                  • Use the copy button to quickly share formatted updates with clients
                </Text>
              </VStack>
            </VStack>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
};

export default Dashboard;
