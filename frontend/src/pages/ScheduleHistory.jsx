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
  Badge,
  useToast,
  Spinner,
  Select,
  Input,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { scheduleHistoryAPI, scheduleAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ScheduleHistory = () => {
  const [history, setHistory] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [filters, setFilters] = useState({
    scheduleId: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
    days: 30,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    fetchSchedules();
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchSchedules = async () => {
    try {
      const response = await scheduleAPI.getAll();
      setSchedules(response.data.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};

      if (filters.scheduleId !== 'all') {
        const response = await scheduleHistoryAPI.getBySchedule(filters.scheduleId, { page: 1, limit: 100 });
        setHistory(response.data.data.history || []);
      } else {
        if (filters.status !== 'all') params.status = filters.status;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;

        const response = await scheduleHistoryAPI.getAll(params);
        setHistory(response.data.data || []);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load schedule history',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const response = await scheduleHistoryAPI.getStatistics({ days: filters.days });
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleViewDetails = (historyItem) => {
    setSelectedHistory(historyItem);
    onOpen();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this history entry?')) return;

    try {
      await scheduleHistoryAPI.delete(id);
      setHistory(prev => prev.filter(h => h._id !== id));
      toast({
        title: 'Success',
        description: 'History entry deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete history entry',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'green';
      case 'failed':
        return 'red';
      case 'partial':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'partial':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Prepare chart data
  const chartData = statistics?.dailyStats?.map(stat => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Success: stat.success || 0,
    Failed: stat.failed || 0,
    Partial: stat.partial || 0,
    avgTime: stat.avgExecutionTime ? (stat.avgExecutionTime / 1000).toFixed(2) : 0,
  })) || [];

  const pieData = [
    { name: 'Success', value: statistics?.successCount || 0, color: '#48BB78' },
    { name: 'Failed', value: statistics?.failedCount || 0, color: '#F56565' },
    { name: 'Partial', value: statistics?.partialCount || 0, color: '#ED8936' },
  ].filter(item => item.value > 0);

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <HStack justifyContent="space-between">
            <Box>
              <Heading size="lg" mb={2}>
                📊 Schedule Execution History
              </Heading>
              <Text color="gray.600">
                Monitor and analyze your scheduled update executions
              </Text>
            </Box>
            <Button onClick={() => navigate('/schedules')}>
              Manage Schedules
            </Button>
          </HStack>
        </Box>

        {/* Statistics Cards */}
        {statsLoading ? (
          <Box textAlign="center" py={8}>
            <Spinner />
          </Box>
        ) : statistics && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
            <Card p={5} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <Stat>
                <StatLabel>Total Executions</StatLabel>
                <StatNumber>{statistics.totalExecutions || 0}</StatNumber>
                <StatHelpText>Last {filters.days} days</StatHelpText>
              </Stat>
            </Card>

            <Card p={5} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <Stat>
                <StatLabel>Success Rate</StatLabel>
                <StatNumber color="green.500">
                  {statistics.successRate ? statistics.successRate.toFixed(1) : 0}%
                </StatNumber>
                <StatHelpText>
                  {statistics.successCount || 0} successful
                </StatHelpText>
              </Stat>
            </Card>

            <Card p={5} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <Stat>
                <StatLabel>Failed Executions</StatLabel>
                <StatNumber color="red.500">
                  {statistics.failedCount || 0}
                </StatNumber>
                <StatHelpText>
                  {statistics.partialCount || 0} partial failures
                </StatHelpText>
              </Stat>
            </Card>

            <Card p={5} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <Stat>
                <StatLabel>Avg Execution Time</StatLabel>
                <StatNumber>
                  {statistics.avgExecutionTime
                    ? formatDuration(statistics.avgExecutionTime)
                    : 'N/A'}
                </StatNumber>
                <StatHelpText>Per execution</StatHelpText>
              </Stat>
            </Card>
          </SimpleGrid>
        )}

        {/* Charts */}
        {!statsLoading && statistics && chartData.length > 0 && (
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
            {/* Execution Trend Chart */}
            <Card p={5} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>
                Execution Trend
              </Heading>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="Success" fill="#48BB78" />
                  <Bar dataKey="Failed" fill="#F56565" />
                  <Bar dataKey="Partial" fill="#ED8936" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Success Rate Pie Chart */}
            <Card p={5} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>
                Execution Status Distribution
              </Heading>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Execution Time Trend */}
            <Card p={5} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>
                Average Execution Time
              </Heading>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgTime" stroke="#4299E1" name="Avg Time (s)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Quick Stats */}
            <Card p={5} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
              <Heading size="md" mb={4}>
                Quick Insights
              </Heading>
              <VStack align="stretch" gap={3}>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Total Executions:</Text>
                  <Badge colorScheme="blue">{statistics.totalExecutions || 0}</Badge>
                </HStack>
                <Divider />
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Successful:</Text>
                  <Badge colorScheme="green">{statistics.successCount || 0}</Badge>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Failed:</Text>
                  <Badge colorScheme="red">{statistics.failedCount || 0}</Badge>
                </HStack>
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Partial:</Text>
                  <Badge colorScheme="orange">{statistics.partialCount || 0}</Badge>
                </HStack>
                <Divider />
                <HStack justifyContent="space-between">
                  <Text fontSize="sm" color="gray.600">Success Rate:</Text>
                  <Text fontWeight="bold" color="green.500">
                    {statistics.successRate ? statistics.successRate.toFixed(1) : 0}%
                  </Text>
                </HStack>
              </VStack>
            </Card>
          </SimpleGrid>
        )}

        {/* Filters */}
        <Card p={4} bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} gap={4}>
            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Schedule
              </Text>
              <Select
                value={filters.scheduleId}
                onChange={(e) => setFilters({ ...filters, scheduleId: e.target.value })}
              >
                <option value="all">All Schedules</option>
                {schedules.map((schedule) => (
                  <option key={schedule._id} value={schedule._id}>
                    {schedule.name}
                  </option>
                ))}
              </Select>
            </Box>

            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Status
              </Text>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="partial">Partial</option>
              </Select>
            </Box>

            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Start Date
              </Text>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </Box>

            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">
                End Date
              </Text>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </Box>

            <Box>
              <Text fontSize="sm" mb={2} fontWeight="medium">
                Stats Period
              </Text>
              <Select
                value={filters.days}
                onChange={(e) => {
                  setFilters({ ...filters, days: parseInt(e.target.value) });
                  fetchStatistics();
                }}
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
              </Select>
            </Box>
          </SimpleGrid>
        </Card>

        {/* History Table */}
        <Card bg={bgColor} borderWidth="1px" borderColor={borderColor}>
          <Box p={4} borderBottomWidth="1px">
            <Heading size="md">Execution History</Heading>
          </Box>

          {loading ? (
            <Box textAlign="center" py={12}>
              <Spinner size="xl" />
              <Text mt={4} color="gray.600">
                Loading history...
              </Text>
            </Box>
          ) : history.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="4xl" mb={4}>
                📭
              </Text>
              <Heading size="md" mb={2}>
                No execution history
              </Heading>
              <Text color="gray.600">
                No schedule executions found for the selected filters
              </Text>
            </Box>
          ) : (
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Status</Th>
                    <Th>Schedule</Th>
                    <Th>Executed At</Th>
                    <Th>Duration</Th>
                    <Th>Email Sent</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {history.map((item) => (
                    <Tr key={item._id}>
                      <Td>
                        <HStack>
                          <Text>{getStatusIcon(item.status)}</Text>
                          <Badge colorScheme={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontWeight="medium">
                          {item.metadata?.scheduleName || 'Unknown'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {item.metadata?.frequency}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(item.executedAt).toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">{formatDuration(item.executionTimeMs)}</Text>
                      </Td>
                      <Td>
                        {item.emailSent ? (
                          <Badge colorScheme="green">Yes</Badge>
                        ) : (
                          <Badge colorScheme="gray">No</Badge>
                        )}
                      </Td>
                      <Td>
                        <HStack>
                          <Tooltip label="View Details">
                            <IconButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(item)}
                              aria-label="View details"
                            >
                              👁️
                            </IconButton>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorScheme="red"
                              onClick={() => handleDelete(item._id)}
                              aria-label="Delete"
                            >
                              🗑️
                            </IconButton>
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </VStack>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Execution Details
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedHistory && (
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Status
                  </Text>
                  <HStack>
                    <Text>{getStatusIcon(selectedHistory.status)}</Text>
                    <Badge colorScheme={getStatusColor(selectedHistory.status)} fontSize="md" px={3} py={1}>
                      {selectedHistory.status.toUpperCase()}
                    </Badge>
                  </HStack>
                </Box>

                <Divider />

                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Schedule Name
                  </Text>
                  <Text fontWeight="medium">{selectedHistory.metadata?.scheduleName || 'Unknown'}</Text>
                </Box>

                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Frequency
                  </Text>
                  <Badge>{selectedHistory.metadata?.frequency}</Badge>
                </Box>

                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Executed At
                  </Text>
                  <Text>{new Date(selectedHistory.executedAt).toLocaleString()}</Text>
                </Box>

                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Execution Time
                  </Text>
                  <Text>{formatDuration(selectedHistory.executionTimeMs)}</Text>
                </Box>

                <Box>
                  <Text fontSize="sm" color="gray.600" mb={1}>
                    Email Sent
                  </Text>
                  <Badge colorScheme={selectedHistory.emailSent ? 'green' : 'gray'}>
                    {selectedHistory.emailSent ? 'Yes' : 'No'}
                  </Badge>
                </Box>

                {selectedHistory.createdUpdateId && (
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Created Update ID
                    </Text>
                    <Text fontFamily="mono" fontSize="sm">
                      {selectedHistory.createdUpdateId}
                    </Text>
                  </Box>
                )}

                {selectedHistory.error && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Error Message
                      </Text>
                      <Box
                        p={3}
                        bg="red.50"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="red.200"
                      >
                        <Text color="red.700" fontSize="sm">
                          {selectedHistory.error.message}
                        </Text>
                      </Box>
                    </Box>
                  </>
                )}

                {selectedHistory.metadata && Object.keys(selectedHistory.metadata).length > 2 && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={2}>
                        Additional Metadata
                      </Text>
                      <Box
                        p={3}
                        bg="gray.50"
                        borderRadius="md"
                        fontFamily="mono"
                        fontSize="xs"
                        maxH="200px"
                        overflowY="auto"
                      >
                        <pre>{JSON.stringify(selectedHistory.metadata, null, 2)}</pre>
                      </Box>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default ScheduleHistory;
