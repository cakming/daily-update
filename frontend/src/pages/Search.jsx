import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Input,
  Select,
  Button,
  Text,
  Card,
  Badge,
  useToast,
  Spinner,
  SimpleGrid,
  Divider,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { dailyUpdateAPI, weeklyUpdateAPI, companyAPI, tagAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * Advanced Search Page
 * Comprehensive search interface for daily and weekly updates
 */
const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [updateType, setUpdateType] = useState('all'); // all, daily, weekly
  const [companyFilter, setCompanyFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, company

  const [results, setResults] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();

  // Fetch companies and tags for filters
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [companiesRes, tagsRes] = await Promise.all([
        companyAPI.getAll(),
        tagAPI.getAll(),
      ]);
      setCompanies(companiesRes.data.data || []);
      setTags(tagsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  // Perform search
  const handleSearch = async () => {
    try {
      setLoading(true);
      setHasSearched(true);

      let allResults = [];

      // Fetch daily updates if needed
      if (updateType === 'all' || updateType === 'daily') {
        try {
          const dailyParams = {};
          if (companyFilter !== 'all') dailyParams.companyId = companyFilter;
          if (tagFilter !== 'all') dailyParams.tags = tagFilter;
          if (dateFrom) dailyParams.startDate = dateFrom;
          if (dateTo) dailyParams.endDate = dateTo;

          const dailyRes = await dailyUpdateAPI.getAll(dailyParams);
          const dailyUpdates = (dailyRes.data.data || []).map(update => ({
            ...update,
            type: 'daily',
          }));
          allResults = [...allResults, ...dailyUpdates];
        } catch (error) {
          console.error('Error fetching daily updates:', error);
        }
      }

      // Fetch weekly updates if needed
      if (updateType === 'all' || updateType === 'weekly') {
        try {
          const weeklyParams = {};
          if (companyFilter !== 'all') weeklyParams.companyId = companyFilter;
          if (tagFilter !== 'all') weeklyParams.tags = tagFilter;
          if (dateFrom) weeklyParams.startDate = dateFrom;
          if (dateTo) weeklyParams.endDate = dateTo;

          const weeklyRes = await weeklyUpdateAPI.getAll(weeklyParams);
          const weeklyUpdates = (weeklyRes.data.data || []).map(update => ({
            ...update,
            type: 'weekly',
          }));
          allResults = [...allResults, ...weeklyUpdates];
        } catch (error) {
          console.error('Error fetching weekly updates:', error);
        }
      }

      // Filter by search term (client-side)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        allResults = allResults.filter(update => {
          const content = update.content?.toLowerCase() || '';
          const aiSummary = update.aiSummary?.toLowerCase() || '';
          const companyName = update.company?.name?.toLowerCase() || '';
          return content.includes(term) || aiSummary.includes(term) || companyName.includes(term);
        });
      }

      // Sort results
      if (sortBy === 'date-desc') {
        allResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (sortBy === 'date-asc') {
        allResults.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === 'company') {
        allResults.sort((a, b) => {
          const nameA = a.company?.name || '';
          const nameB = b.company?.name || '';
          return nameA.localeCompare(nameB);
        });
      }

      setResults(allResults);
    } catch (error) {
      toast({
        title: 'Search failed',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear all filters
  const handleClear = () => {
    setSearchTerm('');
    setUpdateType('all');
    setCompanyFilter('all');
    setTagFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('date-desc');
    setResults([]);
    setHasSearched(false);
  };

  // View update details
  const handleViewUpdate = (update) => {
    // Navigate to history page with the update visible
    navigate('/history');
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            🔍 Advanced Search
          </Heading>
          <Text color="gray.600">
            Search and filter your daily and weekly updates
          </Text>
        </Box>

        {/* Search Filters */}
        <Card.Root p={6}>
          <VStack gap={4} align="stretch">
            {/* Search Term */}
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                🔍
              </InputLeftElement>
              <Input
                placeholder="Search in content, summary, or company name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                size="lg"
              />
            </InputGroup>

            <Divider />

            {/* Filters Grid */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {/* Update Type */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Update Type
                </Text>
                <Select
                  value={updateType}
                  onChange={(e) => setUpdateType(e.target.value)}
                >
                  <option value="all">All Updates</option>
                  <option value="daily">Daily Updates</option>
                  <option value="weekly">Weekly Summaries</option>
                </Select>
              </Box>

              {/* Company Filter */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Company
                </Text>
                <Select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                >
                  <option value="all">All Companies</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </Select>
              </Box>

              {/* Tag Filter */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Tag
                </Text>
                <Select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                >
                  <option value="all">All Tags</option>
                  {tags.map((tag) => (
                    <option key={tag._id} value={tag._id}>
                      {tag.name}
                    </option>
                  ))}
                </Select>
              </Box>

              {/* Date From */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  From Date
                </Text>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </Box>

              {/* Date To */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  To Date
                </Text>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </Box>

              {/* Sort By */}
              <Box>
                <Text fontSize="sm" fontWeight="bold" mb={2}>
                  Sort By
                </Text>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="company">Company Name</option>
                </Select>
              </Box>
            </SimpleGrid>

            {/* Action Buttons */}
            <HStack justifyContent="flex-end" gap={3}>
              <Button onClick={handleClear} variant="outline">
                Clear Filters
              </Button>
              <Button onClick={handleSearch} colorScheme="blue" isLoading={loading}>
                Search
              </Button>
            </HStack>
          </VStack>
        </Card.Root>

        {/* Results */}
        {loading ? (
          <Box textAlign="center" py={12}>
            <Spinner size="xl" />
            <Text mt={4} color="gray.600">
              Searching...
            </Text>
          </Box>
        ) : hasSearched ? (
          results.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="4xl" mb={4}>
                🔍
              </Text>
              <Heading size="md" mb={2}>
                No results found
              </Heading>
              <Text color="gray.600">
                Try adjusting your search criteria
              </Text>
            </Box>
          ) : (
            <VStack gap={4} align="stretch">
              <HStack justifyContent="space-between">
                <Text fontWeight="bold" fontSize="lg">
                  {results.length} {results.length === 1 ? 'result' : 'results'} found
                </Text>
              </HStack>

              {results.map((update) => (
                <Card.Root
                  key={`${update.type}-${update._id}`}
                  p={5}
                  cursor="pointer"
                  _hover={{ shadow: 'md' }}
                  onClick={() => handleViewUpdate(update)}
                >
                  <VStack align="start" gap={3}>
                    <HStack justifyContent="space-between" w="full">
                      <HStack gap={2}>
                        <Badge colorScheme={update.type === 'daily' ? 'blue' : 'green'}>
                          {update.type === 'daily' ? 'Daily Update' : 'Weekly Summary'}
                        </Badge>
                        {update.company && (
                          <Badge colorScheme="purple">{update.company.name}</Badge>
                        )}
                        {update.tags && update.tags.length > 0 && (
                          <>
                            {update.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag._id}
                                colorScheme="cyan"
                                variant="subtle"
                              >
                                {tag.name}
                              </Badge>
                            ))}
                            {update.tags.length > 3 && (
                              <Badge colorScheme="cyan" variant="subtle">
                                +{update.tags.length - 3}
                              </Badge>
                            )}
                          </>
                        )}
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(update.createdAt).toLocaleDateString()}
                      </Text>
                    </HStack>

                    {update.aiSummary && (
                      <Text fontWeight="bold" fontSize="md">
                        {update.aiSummary}
                      </Text>
                    )}

                    <Text color="gray.600" noOfLines={3}>
                      {update.content}
                    </Text>

                    {update.type === 'weekly' && update.period && (
                      <Text fontSize="sm" color="gray.500">
                        Period: {new Date(update.period.startDate).toLocaleDateString()} -{' '}
                        {new Date(update.period.endDate).toLocaleDateString()}
                      </Text>
                    )}
                  </VStack>
                </Card.Root>
              ))}
            </VStack>
          )
        ) : (
          <Box textAlign="center" py={12}>
            <Text fontSize="4xl" mb={4}>
              🔎
            </Text>
            <Heading size="md" mb={2}>
              Ready to search
            </Heading>
            <Text color="gray.600">
              Enter your search criteria and click "Search" to find updates
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default Search;
