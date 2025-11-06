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
  Badge,
  useToast,
  SimpleGrid,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { dailyUpdateAPI, weeklyUpdateAPI, companyAPI } from '../services/api';
import CompanySelector from '../components/CompanySelector';
import ExportButton from '../components/ExportButton';
import { format } from 'date-fns';

const History = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [weeklyUpdates, setWeeklyUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      setCompanies(response.data.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const params = selectedCompanyId ? { companyId: selectedCompanyId } : {};

      const [dailyResponse, weeklyResponse] = await Promise.all([
        dailyUpdateAPI.getAll(params),
        weeklyUpdateAPI.getAll(params),
      ]);

      setDailyUpdates(dailyResponse.data.data);
      setWeeklyUpdates(weeklyResponse.data.data);
    } catch (error) {
      console.error('Error fetching updates:', error);
      toast({
        title: 'Failed to load updates',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this update?')) {
      return;
    }

    try {
      if (type === 'daily') {
        await dailyUpdateAPI.delete(id);
      } else {
        await weeklyUpdateAPI.delete(id);
      }

      toast({
        title: 'Update deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchUpdates();
    } catch (error) {
      console.error('Error deleting update:', error);
      toast({
        title: 'Failed to delete update',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard!',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const filterUpdates = (updates) => {
    if (!searchTerm) return updates;
    return updates.filter(
      (update) =>
        update.formattedOutput.toLowerCase().includes(searchTerm.toLowerCase()) ||
        update.rawInput.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getCompanyById = (companyId) => {
    return companies.find(c => c._id === companyId);
  };

  const UpdateCard = ({ update, type }) => {
    const dateDisplay = type === 'daily'
      ? format(new Date(update.date), 'MMMM dd, yyyy')
      : `${format(new Date(update.dateRange.start), 'MMM dd')} - ${format(new Date(update.dateRange.end), 'MMM dd, yyyy')}`;

    const company = update.companyId ? getCompanyById(update.companyId) : null;

    return (
      <Card.Root p={6}>
        <VStack align="start" gap={4}>
          <HStack justify="space-between" w="full">
            <VStack align="start" gap={1}>
              <HStack>
                <Badge colorScheme={type === 'daily' ? 'blue' : 'green'}>
                  {type === 'daily' ? 'Daily' : 'Weekly'}
                </Badge>
                {company && (
                  <Badge
                    bg={company.color}
                    color="white"
                    fontSize="xs"
                  >
                    {company.name}
                  </Badge>
                )}
                <Text fontSize="sm" color="gray.600">
                  {dateDisplay}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Created {format(new Date(update.createdAt), 'MMM dd, yyyy h:mm a')}
              </Text>
            </VStack>
          </HStack>

          <Box
            bg="gray.50"
            p={4}
            borderRadius="md"
            w="full"
            maxH="300px"
            overflowY="auto"
            whiteSpace="pre-wrap"
            fontSize="sm"
            lineHeight="tall"
          >
            {update.formattedOutput}
          </Box>

          <HStack gap={2} w="full">
            <Button
              onClick={() => handleCopy(update.formattedOutput)}
              colorScheme="blue"
              size="sm"
              flex={1}
            >
              Copy
            </Button>
            <Button
              onClick={() => handleDelete(update._id, type)}
              colorScheme="red"
              variant="outline"
              size="sm"
            >
              Delete
            </Button>
          </HStack>
        </VStack>
      </Card.Root>
    );
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="purple.600">
              Update History
            </Heading>
            <HStack gap={2}>
              <ExportButton
                filters={selectedCompanyId ? { companyId: selectedCompanyId } : {}}
              />
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={8}>
        <VStack gap={6} align="stretch">
          {/* Search and Filters */}
          <Card.Root p={4}>
            <VStack gap={4} align="stretch">
              <Input
                placeholder="Search updates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="lg"
              />
              <FormControl>
                <FormLabel fontSize="sm">Filter by Company</FormLabel>
                <CompanySelector
                  value={selectedCompanyId}
                  onChange={setSelectedCompanyId}
                  placeholder="All companies"
                />
              </FormControl>
            </VStack>
          </Card.Root>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Card.Root p={4} bg="blue.50" borderColor="blue.200" borderWidth="1px">
              <VStack align="start">
                <Text fontSize="sm" color="blue.600" fontWeight="medium">
                  Daily Updates
                </Text>
                <Heading size="xl" color="blue.700">
                  {filterUpdates(dailyUpdates).length}
                </Heading>
              </VStack>
            </Card.Root>

            <Card.Root p={4} bg="green.50" borderColor="green.200" borderWidth="1px">
              <VStack align="start">
                <Text fontSize="sm" color="green.600" fontWeight="medium">
                  Weekly Summaries
                </Text>
                <Heading size="xl" color="green.700">
                  {filterUpdates(weeklyUpdates).length}
                </Heading>
              </VStack>
            </Card.Root>
          </SimpleGrid>

          {/* Updates List */}
          <Tabs.Root defaultValue="daily">
            <TabList>
              <Tabs.Trigger value="daily">
                Daily Updates ({filterUpdates(dailyUpdates).length})
              </Tabs.Trigger>
              <Tabs.Trigger value="weekly">
                Weekly Summaries ({filterUpdates(weeklyUpdates).length})
              </Tabs.Trigger>
            </TabList>

            <TabPanels>
              <TabPanel value="daily">
                {loading ? (
                  <Text>Loading...</Text>
                ) : filterUpdates(dailyUpdates).length === 0 ? (
                  <Card.Root p={8}>
                    <VStack>
                      <Text color="gray.500">No daily updates found</Text>
                      <Button
                        onClick={() => navigate('/daily-update/create')}
                        colorScheme="blue"
                        mt={2}
                      >
                        Create Your First Daily Update
                      </Button>
                    </VStack>
                  </Card.Root>
                ) : (
                  <VStack gap={4} align="stretch" mt={4}>
                    {filterUpdates(dailyUpdates).map((update) => (
                      <UpdateCard key={update._id} update={update} type="daily" />
                    ))}
                  </VStack>
                )}
              </TabPanel>

              <TabPanel value="weekly">
                {loading ? (
                  <Text>Loading...</Text>
                ) : filterUpdates(weeklyUpdates).length === 0 ? (
                  <Card.Root p={8}>
                    <VStack>
                      <Text color="gray.500">No weekly summaries found</Text>
                      <Button
                        onClick={() => navigate('/weekly-update/create')}
                        colorScheme="green"
                        mt={2}
                      >
                        Generate Your First Weekly Summary
                      </Button>
                    </VStack>
                  </Card.Root>
                ) : (
                  <VStack gap={4} align="stretch" mt={4}>
                    {filterUpdates(weeklyUpdates).map((update) => (
                      <UpdateCard key={update._id} update={update} type="weekly" />
                    ))}
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs.Root>
        </VStack>
      </Container>
    </Box>
  );
};

export default History;
