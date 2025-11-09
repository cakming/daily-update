import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Card,
  Badge,
  IconButton,
  
  Spinner,
  Center,
  Stack,
  useToast,
} from '@chakra-ui/react';
import { templateAPI } from '../services/api';

const Templates = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    type: 'daily',
    category: '',
  });

  useEffect(() => {
    fetchTemplates();
  }, [filterType]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterType !== 'all') params.type = filterType;

      const response = await templateAPI.getAll(params);
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Failed to load templates',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.content) {
      toast({
        title: 'Validation error',
        description: 'Name and content are required',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (editingTemplate) {
        await templateAPI.update(editingTemplate._id, formData);
        toast({
          title: 'Template updated!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await templateAPI.create(formData);
        toast({
          title: 'Template created!',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      resetForm();
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Failed to save template',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      content: template.content,
      type: template.type,
      category: template.category || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await templateAPI.delete(templateId);
      toast({
        title: 'Template deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Failed to delete template',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      await templateAPI.use(template._id);
      // Navigate to create page with template content
      navigate('/daily-updates/create', {
        state: { templateContent: template.content },
      });
    } catch (error) {
      console.error('Error using template:', error);
      toast({
        title: 'Failed to use template',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      type: 'daily',
      category: '',
    });
    setEditingTemplate(null);
    setShowForm(false);
  };

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      template.name.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.category?.toLowerCase().includes(query)
    );
  });

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="lg">Update Templates</Heading>
          <Button
            colorScheme="teal"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'New Template'}
          </Button>
        </HStack>

        {/* Search and Filter */}
        {!showForm && (
          <HStack spacing={4}>
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              flex={1}
            />
            <HStack>
              <Button
                size="sm"
                variant={filterType === 'all' ? 'solid' : 'outline'}
                colorScheme="teal"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterType === 'daily' ? 'solid' : 'outline'}
                colorScheme="teal"
                onClick={() => setFilterType('daily')}
              >
                Daily
              </Button>
              <Button
                size="sm"
                variant={filterType === 'weekly' ? 'solid' : 'outline'}
                colorScheme="teal"
                onClick={() => setFilterType('weekly')}
              >
                Weekly
              </Button>
            </HStack>
          </HStack>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <Card.Root p={6}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <Heading size="md">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </Heading>

                <Box>
                  <Text mb={2} fontWeight="medium">
                    Name *
                  </Text>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Daily Standup, Sprint Update"
                    required
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">
                    Description
                  </Text>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of this template"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">
                    Type *
                  </Text>
                  <HStack>
                    <Button
                      size="sm"
                      variant={formData.type === 'daily' ? 'solid' : 'outline'}
                      colorScheme="teal"
                      onClick={() => setFormData({ ...formData, type: 'daily' })}
                    >
                      Daily
                    </Button>
                    <Button
                      size="sm"
                      variant={formData.type === 'weekly' ? 'solid' : 'outline'}
                      colorScheme="teal"
                      onClick={() => setFormData({ ...formData, type: 'weekly' })}
                    >
                      Weekly
                    </Button>
                  </HStack>
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">
                    Category
                  </Text>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g., Standup, Sprint, Project"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">
                    Content *
                  </Text>
                  <Textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Template content with placeholders..."
                    rows={10}
                    required
                  />
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Tip: Use placeholders like [PROJECT], [TASK], [ISSUE] that you can
                    fill in when using the template
                  </Text>
                </Box>

                <HStack justify="flex-end">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" colorScheme="teal">
                    {editingTemplate ? 'Update' : 'Create'}
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Card.Root>
        )}

        {/* Templates List */}
        {!showForm && (
          <>
            {loading ? (
              <Center py={12}>
                <Spinner size="xl" color="teal.500" />
              </Center>
            ) : filteredTemplates.length === 0 ? (
              <Center py={12}>
                <VStack>
                  <Text fontSize="lg" color="gray.500">
                    {searchQuery
                      ? 'No templates found matching your search'
                      : 'No templates yet. Create your first template!'}
                  </Text>
                  {!searchQuery && (
                    <Button
                      mt={4}
                      colorScheme="teal"
                      onClick={() => setShowForm(true)}
                    >
                      Create Template
                    </Button>
                  )}
                </VStack>
              </Center>
            ) : (
              <VStack spacing={4} align="stretch">
                {filteredTemplates.map((template) => (
                  <Card.Root key={template._id} p={6}>
                    <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <HStack>
                          <Heading size="md">{template.name}</Heading>
                          <Badge colorScheme={template.type === 'daily' ? 'blue' : 'purple'}>
                            {template.type}
                          </Badge>
                          {template.category && (
                            <Badge variant="outline">{template.category}</Badge>
                          )}
                        </HStack>
                        <HStack>
                          <Button
                            size="sm"
                            colorScheme="teal"
                            onClick={() => handleUseTemplate(template)}
                          >
                            Use
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(template)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => handleDelete(template._id)}
                          >
                            Delete
                          </Button>
                        </HStack>
                      </HStack>

                      {template.description && (
                        <Text color="gray.600">{template.description}</Text>
                      )}

                      <Box
                        p={4}
                        bg="gray.50"
                        borderRadius="md"
                        fontFamily="mono"
                        fontSize="sm"
                        whiteSpace="pre-wrap"
                      >
                        {template.content.slice(0, 200)}
                        {template.content.length > 200 && '...'}
                      </Box>

                      <HStack fontSize="sm" color="gray.500">
                        <Text>Used {template.usageCount} times</Text>
                        {template.lastUsedAt && (
                          <Text>
                            • Last used {new Date(template.lastUsedAt).toLocaleDateString()}
                          </Text>
                        )}
                      </HStack>
                    </VStack>
                  </Card.Root>
                ))}
              </VStack>
            )}
          </>
        )}
      </VStack>
    </Container>
  );
};

export default Templates;
