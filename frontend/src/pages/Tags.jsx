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
  Input,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Text,
  Badge,
  SimpleGrid,
  Flex,
  IconButton,
  Modal,
  Tabs,
} from '@chakra-ui/react';
import { tagAPI } from '../services/api';

const Tags = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tagStats, setTagStats] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    color: '#3182CE',
    category: 'custom',
  });

  // Predefined colors
  const colorOptions = [
    { name: 'Blue', value: '#3182CE' },
    { name: 'Green', value: '#38A169' },
    { name: 'Red', value: '#E53E3E' },
    { name: 'Orange', value: '#DD6B20' },
    { name: 'Purple', value: '#805AD5' },
    { name: 'Pink', value: '#D53F8C' },
    { name: 'Teal', value: '#319795' },
    { name: 'Cyan', value: '#00B5D8' },
    { name: 'Yellow', value: '#D69E2E' },
    { name: 'Gray', value: '#718096' },
  ];

  const categoryOptions = [
    { label: 'Project', value: 'project' },
    { label: 'Priority', value: 'priority' },
    { label: 'Status', value: 'status' },
    { label: 'Custom', value: 'custom' },
  ];

  useEffect(() => {
    fetchTags();
    fetchTagStats();
  }, [selectedCategory]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      const response = await tagAPI.getAll(params);
      setTags(response.data.data);
    } catch (error) {
      toast({
        title: 'Failed to load tags',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTagStats = async () => {
    try {
      const response = await tagAPI.getStats();
      setTagStats(response.data.data);
    } catch (error) {
      console.error('Failed to load tag stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTag) {
        await tagAPI.update(editingTag._id, formData);
        toast({
          title: 'Tag updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await tagAPI.create(formData);
        toast({
          title: 'Tag created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      // Reset form
      setFormData({ name: '', color: '#3182CE', category: 'custom' });
      setEditingTag(null);
      setIsCreateModalOpen(false);
      fetchTags();
      fetchTagStats();
    } catch (error) {
      toast({
        title: editingTag ? 'Failed to update tag' : 'Failed to create tag',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
      category: tag.category,
    });
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (tagId, permanent = false) => {
    const confirmMessage = permanent
      ? 'Permanently delete this tag? It will be removed from all updates.'
      : 'Deactivate this tag? You can reactivate it later.';

    if (!window.confirm(confirmMessage)) return;

    try {
      await tagAPI.delete(tagId, permanent);
      toast({
        title: permanent ? 'Tag permanently deleted' : 'Tag deactivated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTags();
      fetchTagStats();
    } catch (error) {
      toast({
        title: 'Failed to delete tag',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getCategoryBadgeColor = (category) => {
    switch (category) {
      case 'project':
        return 'blue';
      case 'priority':
        return 'red';
      case 'status':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="pink.600">
              Tags & Categories
            </Heading>
            <HStack>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setEditingTag(null);
                  setFormData({ name: '', color: '#3182CE', category: 'custom' });
                  setIsCreateModalOpen(true);
                }}
                colorScheme="pink"
              >
                Create New Tag
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={8}>
        <VStack gap={6} align="stretch">
          {/* Stats */}
          {tagStats && (
            <SimpleGrid columns={{ base: 1, md: 4 }} gap={4}>
              <Card.Root p={4}>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Total Tags
                  </Text>
                  <Heading size="xl" color="pink.600">
                    {tagStats.totalTags}
                  </Heading>
                </VStack>
              </Card.Root>
              <Card.Root p={4}>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Project Tags
                  </Text>
                  <Heading size="xl" color="blue.600">
                    {tagStats.tagsByCategory.project}
                  </Heading>
                </VStack>
              </Card.Root>
              <Card.Root p={4}>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Priority Tags
                  </Text>
                  <Heading size="xl" color="red.600">
                    {tagStats.tagsByCategory.priority}
                  </Heading>
                </VStack>
              </Card.Root>
              <Card.Root p={4}>
                <VStack align="start">
                  <Text fontSize="sm" color="gray.600">
                    Status Tags
                  </Text>
                  <Heading size="xl" color="green.600">
                    {tagStats.tagsByCategory.status}
                  </Heading>
                </VStack>
              </Card.Root>
            </SimpleGrid>
          )}

          {/* Category Filter */}
          <Card.Root p={4}>
            <HStack>
              <Text fontWeight="medium">Filter by Category:</Text>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                maxW="200px"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </HStack>
          </Card.Root>

          {/* Tags List */}
          <Card.Root p={6}>
            <VStack align="stretch" gap={4}>
              <Heading size="md">Your Tags</Heading>

              {loading ? (
                <Text>Loading tags...</Text>
              ) : tags.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.600" mb={4}>
                    No tags found. Create your first tag to get started!
                  </Text>
                  <Button
                    onClick={() => {
                      setEditingTag(null);
                      setFormData({ name: '', color: '#3182CE', category: 'custom' });
                      setIsCreateModalOpen(true);
                    }}
                    colorScheme="pink"
                  >
                    Create Tag
                  </Button>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                  {tags.map((tag) => (
                    <Card.Root key={tag._id} p={4} borderLeftWidth={4} borderLeftColor={tag.color}>
                      <VStack align="stretch" gap={2}>
                        <HStack justify="space-between">
                          <HStack>
                            <Box w={4} h={4} bg={tag.color} borderRadius="full" />
                            <Text fontWeight="bold">{tag.name}</Text>
                          </HStack>
                          <Badge colorScheme={getCategoryBadgeColor(tag.category)}>
                            {tag.category}
                          </Badge>
                        </HStack>

                        <Text fontSize="sm" color="gray.600">
                          Used {tag.usageCount} times
                        </Text>

                        <HStack mt={2}>
                          <Button size="sm" onClick={() => handleEdit(tag)} colorScheme="blue">
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(tag._id, false)}
                            colorScheme="orange"
                          >
                            Deactivate
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDelete(tag._id, true)}
                            colorScheme="red"
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
          </Card.Root>
        </VStack>
      </Container>

      {/* Create/Edit Modal */}
      <Modal.Root open={isCreateModalOpen} onOpenChange={() => setIsCreateModalOpen(false)}>
        <Modal.Backdrop />
        <Modal.Positioner>
          <Modal.Content>
            <Modal.Header>
              <Modal.Title>{editingTag ? 'Edit Tag' : 'Create New Tag'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form onSubmit={handleSubmit}>
                <VStack gap={4} align="stretch">
                  <FormControl isRequired>
                    <FormLabel>Tag Name</FormLabel>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter tag name"
                      maxLength={50}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Color</FormLabel>
                    <SimpleGrid columns={5} gap={2}>
                      {colorOptions.map((color) => (
                        <Box
                          key={color.value}
                          w="full"
                          h="40px"
                          bg={color.value}
                          borderRadius="md"
                          cursor="pointer"
                          border={formData.color === color.value ? '3px solid' : '1px solid'}
                          borderColor={
                            formData.color === color.value ? 'black' : 'gray.200'
                          }
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          title={color.name}
                          transition="all 0.2s"
                          _hover={{ transform: 'scale(1.1)' }}
                        />
                      ))}
                    </SimpleGrid>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <HStack justify="flex-end" mt={4}>
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" colorScheme="pink">
                      {editingTag ? 'Update' : 'Create'}
                    </Button>
                  </HStack>
                </VStack>
              </form>
            </Modal.Body>
          </Modal.Content>
        </Modal.Positioner>
      </Modal.Root>
    </Box>
  );
};

export default Tags;
