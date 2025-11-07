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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Switch,
  SimpleGrid,
  Divider,
  IconButton,
} from '@chakra-ui/react';
import { scheduleAPI, companyAPI, tagAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import CompanySelector from '../components/CompanySelector';
import TagSelector from '../components/TagSelector';

/**
 * Schedules Page
 * Manage scheduled updates
 */
const Schedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, inactive
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingSchedule, setEditingSchedule] = useState(null);

  const toast = useToast();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    type: 'daily',
    company: '',
    tags: [],
    content: '',
    scheduleType: 'daily',
    scheduledTime: '09:00',
    scheduledDate: '',
    dayOfWeek: 1,
    dayOfMonth: 1,
    timezone: 'UTC',
    recipients: [],
    sendEmail: false,
  });

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'active') params.isActive = true;
      if (filter === 'inactive') params.isActive = false;

      const response = await scheduleAPI.getAll(params);
      setSchedules(response.data.data || []);
    } catch (error) {
      toast({
        title: 'Failed to load schedules',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setFormData({
      type: 'daily',
      company: '',
      tags: [],
      content: '',
      scheduleType: 'daily',
      scheduledTime: '09:00',
      scheduledDate: '',
      dayOfWeek: 1,
      dayOfMonth: 1,
      timezone: 'UTC',
      recipients: [],
      sendEmail: false,
    });
    onOpen();
  };

  const handleOpenEdit = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      type: schedule.type,
      company: schedule.company?._id || '',
      tags: schedule.tags?.map(t => t._id) || [],
      content: schedule.content,
      scheduleType: schedule.scheduleType,
      scheduledTime: schedule.scheduledTime,
      scheduledDate: schedule.scheduledDate ? new Date(schedule.scheduledDate).toISOString().split('T')[0] : '',
      dayOfWeek: schedule.dayOfWeek !== undefined ? schedule.dayOfWeek : 1,
      dayOfMonth: schedule.dayOfMonth || 1,
      timezone: schedule.timezone || 'UTC',
      recipients: schedule.recipients || [],
      sendEmail: schedule.sendEmail || false,
    });
    onOpen();
  };

  const handleSave = async () => {
    try {
      // Validation
      if (!formData.content || !formData.scheduledTime) {
        toast({
          title: 'Missing required fields',
          description: 'Please fill in all required fields',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const data = { ...formData };

      if (editingSchedule) {
        await scheduleAPI.update(editingSchedule._id, data);
        toast({
          title: 'Schedule updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await scheduleAPI.create(data);
        toast({
          title: 'Schedule created',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
      fetchSchedules();
    } catch (error) {
      toast({
        title: editingSchedule ? 'Failed to update schedule' : 'Failed to create schedule',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;

    try {
      await scheduleAPI.delete(id);
      toast({
        title: 'Schedule deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchSchedules();
    } catch (error) {
      toast({
        title: 'Failed to delete schedule',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggle = async (id) => {
    try {
      await scheduleAPI.toggle(id);
      toast({
        title: 'Schedule toggled',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      fetchSchedules();
    } catch (error) {
      toast({
        title: 'Failed to toggle schedule',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getScheduleTypeLabel = (type) => {
    const labels = {
      once: 'One-time',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    };
    return labels[type] || type;
  };

  const getDayName = (day) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="blue.600">
              📅 Scheduled Updates
            </Heading>
            <HStack>
              <Button onClick={handleOpenCreate} colorScheme="blue">
                Create Schedule
              </Button>
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
          {/* Filters */}
          <HStack>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              w="auto"
              minW="200px"
            >
              <option value="all">All Schedules</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Select>
          </HStack>

          {/* Schedules List */}
          {loading ? (
            <Box textAlign="center" py={12}>
              <Spinner size="xl" />
              <Text mt={4} color="gray.600">
                Loading schedules...
              </Text>
            </Box>
          ) : schedules.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="4xl" mb={4}>
                📅
              </Text>
              <Heading size="md" mb={2}>
                No scheduled updates
              </Heading>
              <Text color="gray.600" mb={4}>
                Create a schedule to automatically generate updates
              </Text>
              <Button onClick={handleOpenCreate} colorScheme="blue">
                Create Your First Schedule
              </Button>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
              {schedules.map((schedule) => (
                <Card.Root key={schedule._id} p={5}>
                  <VStack align="start" gap={3}>
                    <HStack justifyContent="space-between" w="full">
                      <HStack gap={2}>
                        <Badge colorScheme={schedule.type === 'daily' ? 'blue' : 'green'}>
                          {schedule.type === 'daily' ? 'Daily Update' : 'Weekly Summary'}
                        </Badge>
                        <Badge colorScheme={schedule.isActive ? 'green' : 'gray'}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge>{getScheduleTypeLabel(schedule.scheduleType)}</Badge>
                      </HStack>
                      <Switch
                        isChecked={schedule.isActive}
                        onChange={() => handleToggle(schedule._id)}
                        colorScheme="green"
                      />
                    </HStack>

                    {schedule.company && (
                      <Text fontSize="sm">
                        <strong>Company:</strong> {schedule.company.name}
                      </Text>
                    )}

                    <Text fontSize="sm" noOfLines={2}>
                      {schedule.content}
                    </Text>

                    <VStack align="start" w="full" fontSize="sm" color="gray.600" gap={1}>
                      <Text>
                        <strong>Time:</strong> {schedule.scheduledTime}
                      </Text>
                      {schedule.scheduleType === 'once' && schedule.scheduledDate && (
                        <Text>
                          <strong>Date:</strong> {new Date(schedule.scheduledDate).toLocaleDateString()}
                        </Text>
                      )}
                      {schedule.scheduleType === 'weekly' && schedule.dayOfWeek !== undefined && (
                        <Text>
                          <strong>Day:</strong> {getDayName(schedule.dayOfWeek)}
                        </Text>
                      )}
                      {schedule.scheduleType === 'monthly' && schedule.dayOfMonth && (
                        <Text>
                          <strong>Day of Month:</strong> {schedule.dayOfMonth}
                        </Text>
                      )}
                      {schedule.nextRun && schedule.isActive && (
                        <Text>
                          <strong>Next Run:</strong> {new Date(schedule.nextRun).toLocaleString()}
                        </Text>
                      )}
                      {schedule.sendEmail && schedule.recipients && schedule.recipients.length > 0 && (
                        <Text>
                          <strong>Email:</strong> {schedule.recipients.length} recipient(s)
                        </Text>
                      )}
                    </VStack>

                    <Divider />

                    <HStack w="full" justifyContent="flex-end" gap={2}>
                      <Button
                        size="sm"
                        onClick={() => handleOpenEdit(schedule)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        onClick={() => handleDelete(schedule._id)}
                      >
                        Delete
                      </Button>
                    </HStack>
                  </VStack>
                </Card.Root>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent maxH="90vh" overflowY="auto">
          <ModalHeader>
            {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack gap={4} align="stretch">
              <FormControl>
                <FormLabel>Update Type *</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="daily">Daily Update</option>
                  <option value="weekly">Weekly Summary</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Company</FormLabel>
                <CompanySelector
                  value={formData.company}
                  onChange={(companyId) => setFormData({ ...formData, company: companyId })}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Tags</FormLabel>
                <TagSelector
                  value={formData.tags}
                  onChange={(tagIds) => setFormData({ ...formData, tags: tagIds })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Content Template *</FormLabel>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the content for the scheduled update..."
                  rows={5}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Schedule Type *</FormLabel>
                <Select
                  value={formData.scheduleType}
                  onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                >
                  <option value="once">One-time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Select>
              </FormControl>

              {formData.scheduleType === 'once' && (
                <FormControl isRequired>
                  <FormLabel>Scheduled Date *</FormLabel>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </FormControl>
              )}

              {formData.scheduleType === 'weekly' && (
                <FormControl>
                  <FormLabel>Day of Week *</FormLabel>
                  <Select
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </Select>
                </FormControl>
              )}

              {formData.scheduleType === 'monthly' && (
                <FormControl>
                  <FormLabel>Day of Month *</FormLabel>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                  />
                </FormControl>
              )}

              <FormControl isRequired>
                <FormLabel>Time *</FormLabel>
                <Input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb={0}>Send Email</FormLabel>
                <Switch
                  isChecked={formData.sendEmail}
                  onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                />
              </FormControl>

              {formData.sendEmail && (
                <FormControl>
                  <FormLabel>Email Recipients (comma-separated)</FormLabel>
                  <Input
                    placeholder="email1@example.com, email2@example.com"
                    value={formData.recipients.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recipients: e.target.value.split(',').map(r => r.trim()).filter(r => r),
                      })
                    }
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} mr={3}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSave}>
              {editingSchedule ? 'Update' : 'Create'} Schedule
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Schedules;
