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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
} from '@chakra-ui/react';
import { dailyUpdateAPI, weeklyUpdateAPI, companyAPI } from '../services/api';
import CompanySelector from '../components/CompanySelector';
import TagFilter from '../components/TagFilter';
import ExportButton from '../components/ExportButton';
import EmailModal from '../components/EmailModal';
import { format, subDays } from 'date-fns';

const History = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [dailyUpdates, setDailyUpdates] = useState([]);
  const [weeklyUpdates, setWeeklyUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  // Email modal state
  const { isOpen: isEmailModalOpen, onOpen: onEmailModalOpen, onClose: onEmailModalClose } = useDisclosure();
  const [emailUpdate, setEmailUpdate] = useState(null);
  const [emailUpdateType, setEmailUpdateType] = useState('daily');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [selectedCompanyId, selectedTags, startDate, endDate]);

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
      const params = {};
      if (selectedCompanyId) params.companyId = selectedCompanyId;
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

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

  const handleEdit = (update, type) => {
    setEditingUpdate({ ...update, type });
    setEditContent(update.rawInput);
    onOpen();
  };

  const handleSave = async () => {
    if (!editingUpdate) return;

    setSaving(true);
    try {
      const { _id, type } = editingUpdate;

      if (type === 'daily') {
        await dailyUpdateAPI.update(_id, { rawInput: editContent });
      } else {
        await weeklyUpdateAPI.update(_id, { rawInput: editContent });
      }

      toast({
        title: 'Update saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchUpdates();
      onClose();
      setEditingUpdate(null);
      setEditContent('');
    } catch (error) {
      console.error('Error saving update:', error);
      toast({
        title: 'Failed to save update',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCompanyId('');
    setSelectedTags([]);
    setStartDate('');
    setEndDate('');
  };

  const handleEmail = (update, type) => {
    setEmailUpdate(update);
    setEmailUpdateType(type);
    onEmailModalOpen();
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
              onClick={() => handleEmail(update, type)}
              colorScheme="purple"
              variant="outline"
              size="sm"
            >
              Email
            </Button>
            <Button
              onClick={() => handleEdit(update, type)}
              colorScheme="teal"
              variant="outline"
              size="sm"
            >
              Edit
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

              <HStack>
                <TagFilter
                  selectedTags={selectedTags}
                  onChange={setSelectedTags}
                />
              </HStack>

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
                  <FormLabel fontSize="sm">Filter by Company</FormLabel>
                  <CompanySelector
                    value={selectedCompanyId}
                    onChange={setSelectedCompanyId}
                    placeholder="All companies"
                  />
                </FormControl>
              </SimpleGrid>

              {(searchTerm || startDate || endDate || selectedCompanyId || selectedTags.length > 0) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  colorScheme="gray"
                  alignSelf="flex-start"
                >
                  Clear All Filters
                </Button>
              )}
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

      {/* Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Edit Update
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack gap={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Edit the raw input below. The update will be re-processed with AI when you save.
              </Text>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={15}
                placeholder="Enter your update content..."
                fontFamily="monospace"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="teal"
              onClick={handleSave}
              isLoading={saving}
              loadingText="Saving..."
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={onEmailModalClose}
        update={emailUpdate}
        updateType={emailUpdateType}
      />
    </Box>
  );
};

export default History;
