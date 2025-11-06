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
  useToast,
  SimpleGrid,
  Input,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { analyticsAPI } from '../services/api';
import CompanySelector from '../components/CompanySelector';
import { format, subDays } from 'date-fns';

const Analytics = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, selectedCompanyId]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {
        startDate,
        endDate,
      };

      if (selectedCompanyId) {
        params.companyId = selectedCompanyId;
      }

      const [dashboardResponse, trendsResponse] = await Promise.all([
        analyticsAPI.getDashboard(params),
        analyticsAPI.getTrends(params),
      ]);

      setDashboardData(dashboardResponse.data.data);
      setTrendsData(trendsResponse.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Failed to load analytics',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, helpText, color = 'blue' }) => (
    <Card.Root p={6} bg={`${color}.50`} borderColor={`${color}.200`} borderWidth="1px">
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
    </Card.Root>
  );

  const TrendItem = ({ date, count, type }) => (
    <HStack justify="space-between" p={3} bg="gray.50" borderRadius="md">
      <VStack align="start" gap={0}>
        <Text fontSize="sm" fontWeight="medium">
          {format(new Date(date), 'MMM dd, yyyy')}
        </Text>
        <Text fontSize="xs" color="gray.600">
          {type === 'daily' ? 'Daily Updates' : 'Weekly Summaries'}
        </Text>
      </VStack>
      <Text fontSize="lg" fontWeight="bold" color={type === 'daily' ? 'blue.600' : 'green.600'}>
        {count}
      </Text>
    </HStack>
  );

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="teal.600">
              Analytics Dashboard
            </Heading>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={8}>
        <VStack gap={6} align="stretch">
          {/* Filters */}
          <Card.Root p={4}>
            <VStack gap={4} align="stretch">
              <Heading size="sm">Filters</Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Start Date</FormLabel>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">End Date</FormLabel>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Company</FormLabel>
                  <CompanySelector
                    value={selectedCompanyId}
                    onChange={setSelectedCompanyId}
                    placeholder="All companies"
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </Card.Root>

          {loading ? (
            <Card.Root p={8}>
              <Text textAlign="center" color="gray.500">
                Loading analytics...
              </Text>
            </Card.Root>
          ) : dashboardData ? (
            <>
              {/* Overview Stats */}
              <Box>
                <Heading size="md" mb={4}>
                  Overview
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
                  <StatCard
                    label="Total Updates"
                    value={dashboardData.totalUpdates}
                    helpText="Daily + Weekly"
                    color="purple"
                  />
                  <StatCard
                    label="Daily Updates"
                    value={dashboardData.dailyUpdates}
                    helpText="In selected period"
                    color="blue"
                  />
                  <StatCard
                    label="Weekly Summaries"
                    value={dashboardData.weeklyUpdates}
                    helpText="In selected period"
                    color="green"
                  />
                  <StatCard
                    label="Active Companies"
                    value={dashboardData.companiesCount || 0}
                    helpText="With updates"
                    color="orange"
                  />
                </SimpleGrid>
              </Box>

              {/* User Stats */}
              {dashboardData.userStats && (
                <Box>
                  <Heading size="md" mb={4}>
                    Your Activity
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                    <StatCard
                      label="Avg. Daily Updates/Week"
                      value={dashboardData.userStats.avgDailyPerWeek?.toFixed(1) || '0.0'}
                      helpText="Your update frequency"
                      color="cyan"
                    />
                    <StatCard
                      label="Most Productive Day"
                      value={dashboardData.userStats.mostProductiveDay || 'N/A'}
                      helpText="Day with most updates"
                      color="pink"
                    />
                    <StatCard
                      label="Current Streak"
                      value={`${dashboardData.userStats.currentStreak || 0} days`}
                      helpText="Consecutive days"
                      color="yellow"
                    />
                  </SimpleGrid>
                </Box>
              )}

              {/* Company Breakdown */}
              {dashboardData.byCompany && dashboardData.byCompany.length > 0 && (
                <Card.Root p={6}>
                  <VStack align="stretch" gap={4}>
                    <Heading size="md">Updates by Company</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                      {dashboardData.byCompany.map((company) => (
                        <Box
                          key={company._id || 'no-company'}
                          p={4}
                          bg="gray.50"
                          borderRadius="md"
                          borderLeftWidth="4px"
                          borderLeftColor={company.color || 'gray.400'}
                        >
                          <VStack align="start" gap={2}>
                            <Text fontWeight="bold" fontSize="lg">
                              {company.name || 'No Company'}
                            </Text>
                            <HStack gap={4}>
                              <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="gray.600">
                                  Daily Updates
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color="blue.600">
                                  {company.dailyCount || 0}
                                </Text>
                              </VStack>
                              <VStack align="start" gap={0}>
                                <Text fontSize="xs" color="gray.600">
                                  Weekly Summaries
                                </Text>
                                <Text fontSize="xl" fontWeight="bold" color="green.600">
                                  {company.weeklyCount || 0}
                                </Text>
                              </VStack>
                            </HStack>
                          </VStack>
                        </Box>
                      ))}
                    </SimpleGrid>
                  </VStack>
                </Card.Root>
              )}

              {/* Trends */}
              {trendsData && (
                <Box>
                  <Heading size="md" mb={4}>
                    Activity Trends
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    {/* Daily Trends */}
                    {trendsData.daily && trendsData.daily.length > 0 && (
                      <Card.Root p={6}>
                        <VStack align="stretch" gap={4}>
                          <Heading size="sm" color="blue.600">
                            Daily Updates Trend
                          </Heading>
                          <VStack gap={2} align="stretch" maxH="400px" overflowY="auto">
                            {trendsData.daily.map((trend, index) => (
                              <TrendItem
                                key={index}
                                date={trend._id}
                                count={trend.count}
                                type="daily"
                              />
                            ))}
                          </VStack>
                        </VStack>
                      </Card.Root>
                    )}

                    {/* Weekly Trends */}
                    {trendsData.weekly && trendsData.weekly.length > 0 && (
                      <Card.Root p={6}>
                        <VStack align="stretch" gap={4}>
                          <Heading size="sm" color="green.600">
                            Weekly Summaries Trend
                          </Heading>
                          <VStack gap={2} align="stretch" maxH="400px" overflowY="auto">
                            {trendsData.weekly.map((trend, index) => (
                              <TrendItem
                                key={index}
                                date={trend._id}
                                count={trend.count}
                                type="weekly"
                              />
                            ))}
                          </VStack>
                        </VStack>
                      </Card.Root>
                    )}
                  </SimpleGrid>
                </Box>
              )}
            </>
          ) : (
            <Card.Root p={8}>
              <VStack>
                <Text color="gray.500" fontSize="lg">
                  No analytics data available
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Try adjusting your filters or create some updates first
                </Text>
              </VStack>
            </Card.Root>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Analytics;
