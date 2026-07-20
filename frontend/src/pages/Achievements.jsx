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
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Progress,
  Spinner,
  Center,
  useToast,
} from '@chakra-ui/react';
import { gamificationAPI } from '../services/api';

/**
 * Achievements page — surfaces the user's streaks and badge progress from
 * GET /api/gamification. Purely a read view; the numbers are derived server-side.
 */
const Achievements = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchGamification();
  }, []);

  const fetchGamification = async () => {
    setLoading(true);
    try {
      const response = await gamificationAPI.get();
      setData(response.data.data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast({
        title: 'Failed to load achievements',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, helpText, color }) => (
    <Card p={6} bg={`${color}.50`} borderColor={`${color}.200`} borderWidth="1px">
      <Stat>
        <StatLabel color={`${color}.600`} fontSize="sm" fontWeight="medium">
          {label}
        </StatLabel>
        <StatNumber color={`${color}.700`} fontSize="3xl" mt={2}>
          {value}
        </StatNumber>
        {helpText && (
          <StatHelpText color={`${color}.600`} fontSize="xs" mt={1}>
            {helpText}
          </StatHelpText>
        )}
      </Stat>
    </Card>
  );

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="purple.600">
              Achievements
            </Heading>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </HStack>
        </Container>
      </Box>

      <Container maxW="7xl" py={8}>
        {loading ? (
          <Center py={20}>
            <Spinner size="xl" color="purple.500" thickness="4px" />
          </Center>
        ) : !data ? (
          <Text color="gray.600">No achievement data available yet.</Text>
        ) : (
          <VStack gap={8} align="stretch">
            {/* Streak + totals */}
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
              <StatCard
                label="Current Streak"
                value={`${data.currentStreak} ${data.currentStreak === 1 ? 'day' : 'days'}`}
                helpText={data.currentStreak > 0 ? 'Keep it going! 🔥' : 'Log an update to start'}
                color="orange"
              />
              <StatCard
                label="Longest Streak"
                value={`${data.longestStreak} ${data.longestStreak === 1 ? 'day' : 'days'}`}
                helpText="Your personal best"
                color="red"
              />
              <StatCard
                label="Total Updates"
                value={data.totalUpdates}
                helpText={`${data.totalDaily} daily · ${data.totalWeekly} weekly`}
                color="blue"
              />
              <StatCard
                label="Badges Earned"
                value={`${data.earnedCount} / ${data.totalAchievements}`}
                helpText={`${data.activeDays} active days`}
                color="purple"
              />
            </SimpleGrid>

            {/* Badge grid */}
            <Box>
              <Heading size="md" mb={4}>
                Badges
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
                {data.achievements.map((a) => {
                  const pct = a.target > 0 ? Math.round((a.progress / a.target) * 100) : 0;
                  return (
                    <Card
                      key={a.id}
                      p={5}
                      borderWidth="1px"
                      borderColor={a.earned ? 'green.300' : 'gray.200'}
                      bg={a.earned ? 'green.50' : 'white'}
                      opacity={a.earned ? 1 : 0.75}
                    >
                      <HStack align="start" gap={4}>
                        <Text fontSize="3xl" aria-hidden="true">
                          {a.icon}
                        </Text>
                        <VStack align="stretch" gap={1} flex="1">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">{a.title}</Text>
                            {a.earned ? (
                              <Badge colorScheme="green">Earned</Badge>
                            ) : (
                              <Badge colorScheme="gray">
                                {a.progress}/{a.target}
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            {a.description}
                          </Text>
                          {!a.earned && (
                            <Progress
                              value={pct}
                              size="sm"
                              colorScheme="purple"
                              borderRadius="full"
                              mt={2}
                            />
                          )}
                        </VStack>
                      </HStack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Box>
          </VStack>
        )}
      </Container>
    </Box>
  );
};

export default Achievements;
