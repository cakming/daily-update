import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  Button,
  HStack,
  Text,
  Card,
  Input,
  useToast,
  Textarea,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { weeklyUpdateAPI } from '../services/api';
import CompanySelector from '../components/CompanySelector';

const CreateWeeklyUpdate = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [companyId, setCompanyId] = useState(null);
  const [rawInput, setRawInput] = useState('');
  const [formattedOutput, setFormattedOutput] = useState('');
  const [sections, setSections] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyUpdatesCount, setDailyUpdatesCount] = useState(0);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Please select both dates',
        description: 'Start and end dates are required',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: 'Invalid date range',
        description: 'Start date must be before end date',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await weeklyUpdateAPI.generate({
        startDate,
        endDate,
        rawInput: rawInput || undefined,
        companyId,
      });

      setFormattedOutput(response.data.data.formattedOutput);
      setSections(response.data.data.sections);
      setDailyUpdatesCount(response.data.data.dailyUpdatesUsed);

      toast({
        title: 'Weekly update generated!',
        description: `Used ${response.data.data.dailyUpdatesUsed} daily updates`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating weekly update:', error);
      toast({
        title: 'Failed to generate update',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formattedOutput) {
      toast({
        title: 'Nothing to save',
        description: 'Please generate a weekly update first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      await weeklyUpdateAPI.create({
        startDate,
        endDate,
        rawInput: rawInput || 'Generated from daily updates',
        formattedOutput,
        sections,
        companyId,
      });

      toast({
        title: 'Weekly update saved!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/history');
    } catch (error) {
      console.error('Error saving weekly update:', error);
      toast({
        title: 'Failed to save update',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
    setStartDate('');
    setEndDate('');
    setCompanyId(null);
    setRawInput('');
    setFormattedOutput('');
    setSections(null);
    setDailyUpdatesCount(0);
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="green.600">
              Generate Weekly Summary
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
          {/* Date Range Picker */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <Heading size="md">Select Date Range</Heading>
              <Text color="gray.600" fontSize="sm">
                Choose the week you want to summarize (e.g., Monday to Friday)
              </Text>
              <HStack gap={4} w="full">
                <VStack align="start" flex={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    Start Date
                  </Text>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </VStack>
                <VStack align="start" flex={1}>
                  <Text fontSize="sm" fontWeight="medium">
                    End Date
                  </Text>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </VStack>
              </HStack>
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

          {/* Optional Manual Input */}
          <Card.Root p={6}>
            <VStack align="start" gap={4}>
              <Heading size="md">Manual Input (Optional)</Heading>
              <Text color="gray.600" fontSize="sm">
                If you don't have daily updates for this period, you can paste technical updates here.
                Otherwise, leave blank to auto-generate from daily updates.
              </Text>
              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Leave blank to use daily updates, or paste technical updates here..."
                minH="150px"
                fontSize="sm"
              />
            </VStack>
          </Card.Root>

          {/* Action Buttons */}
          <HStack gap={4}>
            <Button
              onClick={handleGenerate}
              colorScheme="green"
              size="lg"
              loading={loading}
              flex={1}
            >
              Generate Weekly Summary
            </Button>
            <Button onClick={handleReset} variant="outline" size="lg">
              Reset
            </Button>
          </HStack>

          {/* Preview Section */}
          {formattedOutput && (
            <Card.Root p={6} bg="green.50" borderColor="green.200" borderWidth="2px">
              <VStack align="start" gap={4}>
                <HStack justify="space-between" w="full">
                  <VStack align="start" gap={0}>
                    <Heading size="md" color="green.700">
                      Weekly Summary
                    </Heading>
                    <Text fontSize="sm" color="green.600">
                      Generated from {dailyUpdatesCount} daily update{dailyUpdatesCount !== 1 ? 's' : ''}
                    </Text>
                  </VStack>
                  <HStack gap={2}>
                    <Button onClick={handleCopy} colorScheme="green" size="sm">
                      Copy
                    </Button>
                    <Button onClick={handleSave} colorScheme="blue" size="sm">
                      Save
                    </Button>
                  </HStack>
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
                    onClick={handleSave}
                    colorScheme="green"
                    flex={1}
                  >
                    Save to History
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

export default CreateWeeklyUpdate;
