# Frontend Implementation Guide

Complete guide for implementing missing UI features in the Daily Update App.

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── CompanySelector.jsx          # (NEW) Company dropdown
│   │   ├── ExportButton.jsx             # (NEW) Export dropdown menu
│   │   ├── MetricCard.jsx               # (NEW) Analytics metric card
│   │   ├── charts/                      # (NEW) Chart components
│   │   │   ├── ActivityByDayChart.jsx
│   │   │   ├── TrendsChart.jsx
│   │   │   └── ActivityByMonthChart.jsx
│   │   └── ProtectedRoute.jsx           # (EXISTS)
│   ├── pages/
│   │   ├── Dashboard.jsx                # (EXISTS) - Add new cards
│   │   ├── Companies.jsx                # (NEW) Company management
│   │   ├── Analytics.jsx                # (NEW) Analytics dashboard
│   │   ├── CreateDailyUpdate.jsx        # (EXISTS) - Add company selector
│   │   ├── CreateWeeklyUpdate.jsx       # (EXISTS) - Add company selector
│   │   ├── History.jsx                  # (EXISTS) - Add filters, export, edit
│   │   └── Login.jsx                    # (EXISTS)
│   ├── services/
│   │   └── api.js                       # (EXISTS) - Add 3 new API modules
│   ├── context/
│   │   └── AuthContext.jsx              # (EXISTS)
│   ├── App.jsx                          # (EXISTS) - Add new routes
│   └── main.jsx                         # (EXISTS)
```

---

## Implementation Phase 1: API Services

### Step 1: Update `frontend/src/services/api.js`

Add three new API modules to the existing file:

```javascript
// Add these imports at the top if needed
import axios from 'axios';

// Existing code...
// export const authAPI = { ... }
// export const dailyUpdateAPI = { ... }
// export const weeklyUpdateAPI = { ... }

// ADD: Company APIs
export const companyAPI = {
  create: (data) => api.post('/companies', data),
  getAll: (params) => api.get('/companies', { params }),
  getById: (id) => api.get(`/companies/${id}`),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id, permanent = false) => api.delete(`/companies/${id}`, {
    params: { permanent }
  }),
  getStats: (id) => api.get(`/companies/${id}/stats`),
};

// ADD: Export APIs
export const exportAPI = {
  getMetadata: (params) => api.get('/export/metadata', { params }),
  exportCSV: (params) => api.get('/export/csv', {
    params,
    responseType: 'blob'
  }),
  exportJSON: (params) => api.get('/export/json', {
    params,
    responseType: 'blob'
  }),
  exportMarkdown: (params) => api.get('/export/markdown', {
    params,
    responseType: 'blob'
  }),
};

// ADD: Analytics APIs
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
};

export default api;
```

**Test this step:**
```bash
# Verify no syntax errors
npm run dev
```

---

## Implementation Phase 2: Company Management

### Step 2.1: Create CompanySelector Component

**File:** `frontend/src/components/CompanySelector.jsx`

```javascript
import { useState, useEffect } from 'react';
import { Select, useToast } from '@chakra-ui/react';
import { companyAPI } from '../services/api';

const CompanySelector = ({ value, onChange, required = false, placeholder = "Select company (optional)" }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
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

  return (
    <Select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      placeholder={placeholder}
      isRequired={required}
      isDisabled={loading}
    >
      {companies.map((company) => (
        <option key={company._id} value={company._id}>
          {company.name}
        </option>
      ))}
    </Select>
  );
};

export default CompanySelector;
```

**Usage in other components:**
```javascript
import CompanySelector from '../components/CompanySelector';

// In your form:
const [companyId, setCompanyId] = useState(null);

<FormControl>
  <FormLabel>Company/Client (Optional)</FormLabel>
  <CompanySelector value={companyId} onChange={setCompanyId} />
</FormControl>
```

---

### Step 2.2: Create Companies Management Page

**File:** `frontend/src/pages/Companies.jsx`

```javascript
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
  IconButton,
  SimpleGrid,
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
```

---

### Step 2.3: Update Create Daily Update Form

**File:** `frontend/src/pages/CreateDailyUpdate.jsx`

Find the date picker section and add the company selector below it:

```javascript
import CompanySelector from '../components/CompanySelector';

// Add state
const [companyId, setCompanyId] = useState(null);

// In the form, after the date picker:
<FormControl>
  <FormLabel>Date</FormLabel>
  <Input
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    max={new Date().toISOString().split('T')[0]}
  />
</FormControl>

{/* ADD THIS */}
<FormControl>
  <FormLabel>Company/Client (Optional)</FormLabel>
  <CompanySelector value={companyId} onChange={setCompanyId} />
</FormControl>

{/* Existing raw input textarea */}

// Update the API call in handleSubmit:
const response = await dailyUpdateAPI.create({
  rawInput,
  date,
  companyId  // ADD THIS
});
```

---

### Step 2.4: Update Create Weekly Update Form

Same changes as daily update:

**File:** `frontend/src/pages/CreateWeeklyUpdate.jsx`

```javascript
import CompanySelector from '../components/CompanySelector';

const [companyId, setCompanyId] = useState(null);

// Add after date range picker
<FormControl>
  <FormLabel>Company/Client (Optional)</FormLabel>
  <CompanySelector value={companyId} onChange={setCompanyId} />
</FormControl>

// Update API calls:
await weeklyUpdateAPI.generate({
  startDate,
  endDate,
  rawInput,
  companyId  // ADD THIS
});

await weeklyUpdateAPI.create({
  startDate,
  endDate,
  rawInput: rawInput || 'Generated from daily updates',
  formattedOutput: generatedOutput.formattedOutput,
  sections: generatedOutput.sections,
  companyId  // ADD THIS
});
```

---

### Step 2.5: Update History Page with Company Filter

**File:** `frontend/src/pages/History.jsx`

Add company filter dropdown:

```javascript
import { companyAPI } from '../services/api';

// Add state
const [companies, setCompanies] = useState([]);
const [selectedCompanyId, setSelectedCompanyId] = useState('');

// Fetch companies on mount
useEffect(() => {
  fetchCompanies();
}, []);

const fetchCompanies = async () => {
  try {
    const response = await companyAPI.getAll();
    setCompanies(response.data.data);
  } catch (error) {
    console.error('Error fetching companies:', error);
  }
};

// Update fetchUpdates to include companyId
const fetchUpdates = async () => {
  setLoading(true);
  try {
    const [dailyResponse, weeklyResponse] = await Promise.all([
      dailyUpdateAPI.getAll({ companyId: selectedCompanyId || undefined }),
      weeklyUpdateAPI.getAll({ companyId: selectedCompanyId || undefined }),
    ]);

    setDailyUpdates(dailyResponse.data.data);
    setWeeklyUpdates(weeklyResponse.data.data);
  } catch (error) {
    // ... error handling
  } finally {
    setLoading(false);
  }
};

// Re-fetch when company filter changes
useEffect(() => {
  if (!loading) {
    fetchUpdates();
  }
}, [selectedCompanyId]);

// Add filter UI before search input:
<Card.Root p={4}>
  <HStack gap={4}>
    <Input
      placeholder="Search updates..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      flex={1}
    />
    <Select
      placeholder="All Companies"
      value={selectedCompanyId}
      onChange={(e) => setSelectedCompanyId(e.target.value)}
      w="250px"
    >
      {companies.map(company => (
        <option key={company._id} value={company._id}>
          {company.name}
        </option>
      ))}
    </Select>
  </HStack>
</Card.Root>

// Update UpdateCard to show company badge:
{update.companyId && (
  <Badge
    bg={update.companyId.color}
    color="white"
    fontSize="xs"
  >
    {update.companyId.name}
  </Badge>
)}
```

---

### Step 2.6: Update Dashboard Navigation

**File:** `frontend/src/pages/Dashboard.jsx`

Add new card to the cards array:

```javascript
const cards = [
  {
    title: 'Create Daily Update',
    description: 'Transform technical updates into client-friendly daily reports',
    icon: '📝',
    action: () => navigate('/daily-update/create'),
    color: 'blue',
  },
  {
    title: 'Generate Weekly Summary',
    description: 'Create a cohesive weekly report from daily updates',
    icon: '📊',
    action: () => navigate('/weekly-update/create'),
    color: 'green',
  },
  {
    title: 'View History',
    description: 'Browse and manage all past updates',
    icon: '📚',
    action: () => navigate('/history'),
    color: 'purple',
  },
  // ADD THIS
  {
    title: 'Manage Companies',
    description: 'Organize updates by client or project',
    icon: '🏢',
    action: () => navigate('/companies'),
    color: 'orange',
  },
];
```

---

### Step 2.7: Add Route

**File:** `frontend/src/App.jsx`

Add route for companies page:

```javascript
import Companies from './pages/Companies';

// In the Routes:
<Route path="/companies" element={
  <ProtectedRoute>
    <Companies />
  </ProtectedRoute>
} />
```

---

## Testing Phase 2

```bash
# Start dev server
npm run dev

# Test checklist:
□ Navigate to Companies page from dashboard
□ Create a new company
□ Edit a company
□ Soft delete (deactivate) a company
□ Permanent delete a company
□ Create daily update with company
□ Create weekly update with company
□ Filter history by company
□ See company badges in history
□ Search companies
□ Color picker works
□ Form validation works
□ Error handling shows toasts
```

---

## Summary

This guide covers the complete implementation of company management UI. Continue with MISSING_UI_FEATURES.md for Phase 3 (Export) and Phase 4 (Analytics).

**Estimated Time:** 3-4 hours

**Dependencies:**
- Chakra UI (already installed)
- React Router (already installed)
- Axios (already configured)

**Next Steps:**
1. Implement Export functionality (2-3 hours)
2. Implement Analytics dashboard (3-4 hours)

---

**Last Updated:** 2025-11-06
