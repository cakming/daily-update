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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
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

  // Merge daily and weekly trends for combined chart
  const mergeTrendsData = (trends) => {
    const dailyMap = new Map(
      (trends.daily || []).map(item => [item._id, { date: item._id, daily: item.count, weekly: 0 }])
    );

    (trends.weekly || []).forEach(item => {
      if (dailyMap.has(item._id)) {
        dailyMap.get(item._id).weekly = item.count;
      } else {
        dailyMap.set(item._id, { date: item._id, daily: 0, weekly: item.count });
      }
    });

    return Array.from(dailyMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Calculate cumulative data
  const getCumulativeData = (trends) => {
    const merged = mergeTrendsData(trends);
    let cumulativeDaily = 0;
    let cumulativeWeekly = 0;

    return merged.map(item => {
      cumulativeDaily += item.daily;
      cumulativeWeekly += item.weekly;
      return {
        date: item.date,
        cumulativeDaily,
        cumulativeWeekly,
      };
    });
  };

  // Prepare pie chart data
  const getPieData = (data) => {
    return [
      { name: 'Daily Updates', value: data.dailyUpdates, color: '#3182CE' },
      { name: 'Weekly Summaries', value: data.weeklyUpdates, color: '#38A169' },
    ];
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent === 0) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

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

              {/* Charts Section */}
              {trendsData && (trendsData.daily?.length > 0 || trendsData.weekly?.length > 0) && (
                <>
                  {/* Combined Trend Chart */}
                  <Card.Root p={6}>
                    <VStack align="stretch" gap={4}>
                      <Heading size="md">Activity Trends Over Time</Heading>
                      <Box h="300px">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={mergeTrendsData(trendsData)}
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #CBD5E0', borderRadius: '8px' }}
                              labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="daily"
                              stroke="#3182CE"
                              strokeWidth={2}
                              name="Daily Updates"
                              dot={{ fill: '#3182CE', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="weekly"
                              stroke="#38A169"
                              strokeWidth={2}
                              name="Weekly Summaries"
                              dot={{ fill: '#38A169', r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    </VStack>
                  </Card.Root>

                  {/* Area Chart - Cumulative Updates */}
                  <Card.Root p={6}>
                    <VStack align="stretch" gap={4}>
                      <Heading size="md">Cumulative Updates</Heading>
                      <Box h="300px">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={getCumulativeData(trendsData)}
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3182CE" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3182CE" stopOpacity={0.1} />
                              </linearGradient>
                              <linearGradient id="colorWeekly" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#38A169" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#38A169" stopOpacity={0.1} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #CBD5E0', borderRadius: '8px' }}
                              labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="cumulativeDaily"
                              stroke="#3182CE"
                              fillOpacity={1}
                              fill="url(#colorDaily)"
                              name="Total Daily Updates"
                            />
                            <Area
                              type="monotone"
                              dataKey="cumulativeWeekly"
                              stroke="#38A169"
                              fillOpacity={1}
                              fill="url(#colorWeekly)"
                              name="Total Weekly Summaries"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    </VStack>
                  </Card.Root>
                </>
              )}

              {/* Company Breakdown Chart */}
              {dashboardData.byCompany && dashboardData.byCompany.length > 0 && (
                <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
                  {/* Bar Chart */}
                  <Card.Root p={6}>
                    <VStack align="stretch" gap={4}>
                      <Heading size="md">Updates by Company</Heading>
                      <Box h="300px">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dashboardData.byCompany}
                            margin={{ top: 5, right: 30, left: 0, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #CBD5E0', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="dailyCount" fill="#3182CE" name="Daily Updates" />
                            <Bar dataKey="weeklyCount" fill="#38A169" name="Weekly Summaries" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </VStack>
                  </Card.Root>

                  {/* Pie Chart */}
                  <Card.Root p={6}>
                    <VStack align="stretch" gap={4}>
                      <Heading size="md">Update Distribution</Heading>
                      <Box h="300px">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getPieData(dashboardData)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderCustomizedLabel}
                              outerRadius={100}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getPieData(dashboardData).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #CBD5E0', borderRadius: '8px' }}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </Box>
                    </VStack>
                  </Card.Root>
                </SimpleGrid>
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
