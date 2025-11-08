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
  
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import { companyAPI } from '../services/api';

const Companies = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCompany, setEditingCompany] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3182CE'
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await companyAPI.getAll({ includeInactive: true });
      setCompanies(response.data.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Failed to load companies',
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

    try {
      if (editingCompany) {
        await companyAPI.update(editingCompany._id, formData);
        toast({
          title: 'Company updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        await companyAPI.create(formData);
        toast({
          title: 'Company created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      fetchCompanies();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: 'Failed to save company',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (company, permanent = false) => {
    const message = permanent
      ? 'This will permanently delete the company and all associated updates. This cannot be undone.'
      : 'This will deactivate the company but keep all data.';

    if (!window.confirm(message)) return;

    try {
      await companyAPI.delete(company._id, permanent);
      toast({
        title: permanent ? 'Company permanently deleted' : 'Company deactivated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Failed to delete company',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      description: company.description || '',
      color: company.color
    });
    onOpen();
  };

  const handleCloseModal = () => {
    setEditingCompany(null);
    setFormData({
      name: '',
      description: '',
      color: '#3182CE'
    });
    onClose();
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (company.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="orange.600">
              Company Management
            </Heading>
            <HStack>
              <Button onClick={onOpen} colorScheme="orange">
                + New Company
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
          {/* Search */}
          <Card.Root p={4}>
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="lg"
            />
          </Card.Root>

          {/* Stats */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Card.Root p={4} bg="orange.50" borderColor="orange.200" borderWidth="1px">
              <VStack align="start">
                <Text fontSize="sm" color="orange.600" fontWeight="medium">
                  Total Companies
                </Text>
                <Heading size="xl" color="orange.700">
                  {companies.filter(c => c.isActive).length}
                </Heading>
              </VStack>
            </Card.Root>

            <Card.Root p={4} bg="gray.50" borderColor="gray.200" borderWidth="1px">
              <VStack align="start">
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  Inactive
                </Text>
                <Heading size="xl" color="gray.700">
                  {companies.filter(c => !c.isActive).length}
                </Heading>
              </VStack>
            </Card.Root>
          </SimpleGrid>

          {/* Companies List */}
          {loading ? (
            <Text>Loading...</Text>
          ) : filteredCompanies.length === 0 ? (
            <Card.Root p={8}>
              <VStack>
                <Text color="gray.500">No companies found</Text>
                <Button onClick={onOpen} colorScheme="orange" mt={2}>
                  Create Your First Company
                </Button>
              </VStack>
            </Card.Root>
          ) : (
            <VStack gap={4} align="stretch">
              {filteredCompanies.map((company) => (
                <Card.Root key={company._id} p={6}>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" gap={2} flex={1}>
                      <HStack>
                        <Box
                          w="12px"
                          h="12px"
                          borderRadius="full"
                          bg={company.color}
                        />
                        <Heading size="md">{company.name}</Heading>
                        {!company.isActive && (
                          <Badge colorScheme="red">Inactive</Badge>
                        )}
                      </HStack>
                      {company.description && (
                        <Text fontSize="sm" color="gray.600">
                          {company.description}
                        </Text>
                      )}
                      <HStack gap={4} fontSize="sm" color="gray.500">
                        <Text>{company.updateCount} updates</Text>
                        <Text>Created {new Date(company.createdAt).toLocaleDateString()}</Text>
                      </HStack>
                    </VStack>

                    <HStack gap={2}>
                      <Button
                        onClick={() => handleEdit(company)}
                        size="sm"
                        variant="outline"
                        colorScheme="blue"
                      >
                        Edit
                      </Button>
                      {company.isActive ? (
                        <Button
                          onClick={() => handleDelete(company, false)}
                          size="sm"
                          variant="outline"
                          colorScheme="orange"
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleDelete(company, true)}
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                        >
                          Delete
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                </Card.Root>
              ))}
            </VStack>
          )}
        </VStack>
      </Container>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={handleCloseModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingCompany ? 'Edit Company' : 'Create New Company'}
          </ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleSubmit}>
            <ModalBody>
              <VStack gap={4}>
                <FormControl isRequired>
                  <FormLabel>Company Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Acme Corp"
                    maxLength={100}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Main client project"
                    maxLength={500}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Color</FormLabel>
                  <HStack>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      w="60px"
                      h="40px"
                      p={1}
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      placeholder="#3182CE"
                      pattern="^#[A-Fa-f0-9]{6}$"
                    />
                  </HStack>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button colorScheme="orange" type="submit">
                {editingCompany ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Companies;
