import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  Textarea,
  Button,
  HStack,
  Text,
  Card,
  Input,
  useToast,
  IconButton,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react';
import { dailyUpdateAPI, templateAPI } from '../services/api';
import CompanySelector from '../components/CompanySelector';

const CreateDailyUpdate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [companyId, setCompanyId] = useState(null);
  const [rawInput, setRawInput] = useState('');
  const [formattedOutput, setFormattedOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Load templates on mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Load template content from navigation state if provided
  useEffect(() => {
    if (location.state?.templateContent) {
      setRawInput(location.state.templateContent);
      // Clear the state to prevent reloading on revisit
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchTemplates = async () => {
    try {
      const response = await templateAPI.getAll({ type: 'daily' });
      setTemplates(response.data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        setRawInput(template.content);
        toast({
          title: 'Template loaded',
          description: `Using "${template.name}" template`,
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (!rawInput.trim()) {
      toast({
        title: 'Please enter some text',
        description: 'Raw input cannot be empty',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await dailyUpdateAPI.create({
        rawInput,
        date,
        companyId,
      });

      setFormattedOutput(response.data.data.formattedOutput);
      setSections(response.data.data.sections);

      toast({
        title: 'Daily update created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error creating update:', error);
      toast({
        title: 'Failed to create update',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedOutput);
    toast({
      title: 'Copied to clipboard!',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleReset = () => {
    setRawInput('');
    setFormattedOutput('');
    setSections(null);
    setDate(new Date().toISOString().split('T')[0]);
    setCompanyId(null);
    setSelectedTemplate('');
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="blue.600">
              Create Daily Update
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
          {/* Date Picker */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <Heading size="md">Select Date</Heading>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max="2099-12-31"
              />
            </VStack>
          </Card.Root>

          {/* Company Selector */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <Heading size="md">Company/Client</Heading>
              <FormControl>
                <FormLabel>Select Company (Optional)</FormLabel>
                <CompanySelector
                  value={companyId}
                  onChange={setCompanyId}
                  placeholder="Select company/client (optional)"
                />
              </FormControl>
            </VStack>
          </Card.Root>

          {/* Template Selector */}
          {templates.length > 0 && (
            <Card.Root p={6}>
              <VStack align="start" gap={4}>
                <HStack justify="space-between" w="full">
                  <Heading size="md">Use Template</Heading>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/templates')}
                  >
                    Manage Templates
                  </Button>
                </HStack>
                <Select
                  placeholder="Select a template (optional)"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                >
                  {templates.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                      {template.category && ` (${template.category})`}
                    </option>
                  ))}
                </Select>
              </VStack>
            </Card.Root>
          )}

          {/* Input Section */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <HStack justify="space-between" w="full">
                <Heading size="md">Paste Technical Update</Heading>
                {templates.length === 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/templates')}
                  >
                    Create Template
                  </Button>
                )}
              </HStack>
              <Text color="gray.600" fontSize="sm">
                Paste your technical team updates below. The AI will convert it to client-friendly language.
              </Text>
              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Example:&#10;- Implemented Thread Grouping for Reply Emails&#10;- Fixed race condition in async webhook handler&#10;- Refactored auth middleware for better performance"
                minH="200px"
                fontSize="sm"
              />
            </VStack>
          </Card.Root>

          {/* Action Buttons */}
          <HStack gap={4}>
            <Button
              onClick={handleGenerate}
              colorScheme="blue"
              size="lg"
              loading={loading}
              flex={1}
            >
              Generate Client-Friendly Update
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg">
              Reset
            </Button>
          </HStack>

          {/* Preview Section */}
          {formattedOutput && (
            <Card.Root p={6} bg="blue.50" borderColor="blue.200" borderWidth="2px">
              <VStack align="start" gap={4}>
                <HStack justify="space-between" w="full">
                  <Heading size="md" color="blue.700">
                    Formatted Output
                  </Heading>
                  <Button onClick={handleCopy} colorScheme="blue" size="sm">
                    Copy to Clipboard
                  </Button>
                </HStack>

                <Box
                  bg="white"
                  p={6}
                  borderRadius="md"
                  w="full"
                  whiteSpace="pre-wrap"
                  fontFamily="system-ui"
                  fontSize="sm"
                  lineHeight="tall"
                >
                  {formattedOutput}
                </Box>

                <HStack gap={4} w="full">
                  <Button
                    onClick={() => navigate('/history')}
                    colorScheme="green"
                    flex={1}
                  >
                    View in History
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    flex={1}
                  >
                    Create Another
                  </Button>
                </HStack>
              </VStack>
            </Card.Root>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default CreateDailyUpdate;
