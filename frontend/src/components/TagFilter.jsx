import { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Input,
  Popover,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import { tagAPI } from '../services/api';

/**
 * TagFilter Component
 * Filter component for filtering lists by tags
 *
 * @param {Array} selectedTags - Array of selected tag IDs for filtering
 * @param {Function} onChange - Callback when filter selection changes
 * @param {Boolean} allowMultiple - Allow selecting multiple tags (default: true)
 */
const TagFilter = ({ selectedTags = [], onChange, allowMultiple = true }) => {
  const toast = useToast();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const response = await tagAPI.getAll({ includeInactive: false });
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

  const handleToggleTag = (tagId) => {
    if (allowMultiple) {
      if (selectedTags.includes(tagId)) {
        onChange(selectedTags.filter((id) => id !== tagId));
      } else {
        onChange([...selectedTags, tagId]);
      }
    } else {
      // Single selection mode
      if (selectedTags.includes(tagId)) {
        onChange([]);
      } else {
        onChange([tagId]);
      }
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const getSelectedTagObjects = () => {
    return tags.filter((tag) => selectedTags.includes(tag._id));
  };

  const getFilteredTags = () => {
    if (!searchTerm) return tags;
    return tags.filter((tag) =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const groupedTags = () => {
    const filtered = getFilteredTags();
    return {
      project: filtered.filter((tag) => tag.category === 'project'),
      priority: filtered.filter((tag) => tag.category === 'priority'),
      status: filtered.filter((tag) => tag.category === 'status'),
      custom: filtered.filter((tag) => tag.category === 'custom'),
    };
  };

  const selectedTagObjects = getSelectedTagObjects();
  const tagGroups = groupedTags();

  return (
    <Box>
      <HStack gap={2} flexWrap="wrap">
        {/* Filter Button */}
        <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
          <Popover.Trigger asChild>
            <Button variant="outline" size="sm">
              Filter by Tags
              {selectedTags.length > 0 && (
                <Badge ml={2} colorScheme="pink">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </Popover.Trigger>
          <Popover.Positioner>
            <Popover.Content minW="350px">
              <Popover.Header>
                <VStack align="stretch" gap={2}>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">Filter by Tags</Text>
                    {selectedTags.length > 0 && (
                      <Button size="xs" variant="ghost" onClick={handleClearAll}>
                        Clear All
                      </Button>
                    )}
                  </HStack>
                  <Input
                    placeholder="Search tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                  />
                </VStack>
              </Popover.Header>
              <Popover.Body maxH="350px" overflowY="auto">
                {loading ? (
                  <Text>Loading tags...</Text>
                ) : (
                  <VStack align="stretch" gap={3}>
                    {/* Project Tags */}
                    {tagGroups.project.length > 0 && (
                      <Box>
                        <Text fontWeight="bold" fontSize="xs" mb={2} color="blue.600">
                          PROJECT
                        </Text>
                        <VStack align="stretch" gap={1}>
                          {tagGroups.project.map((tag) => (
                            <Checkbox
                              key={tag._id}
                              checked={selectedTags.includes(tag._id)}
                              onCheckedChange={() => handleToggleTag(tag._id)}
                            >
                              <HStack>
                                <Box w={2} h={2} bg={tag.color} borderRadius="full" />
                                <Text fontSize="sm">{tag.name}</Text>
                              </HStack>
                            </Checkbox>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Priority Tags */}
                    {tagGroups.priority.length > 0 && (
                      <Box>
                        <Text fontWeight="bold" fontSize="xs" mb={2} color="red.600">
                          PRIORITY
                        </Text>
                        <VStack align="stretch" gap={1}>
                          {tagGroups.priority.map((tag) => (
                            <Checkbox
                              key={tag._id}
                              checked={selectedTags.includes(tag._id)}
                              onCheckedChange={() => handleToggleTag(tag._id)}
                            >
                              <HStack>
                                <Box w={2} h={2} bg={tag.color} borderRadius="full" />
                                <Text fontSize="sm">{tag.name}</Text>
                              </HStack>
                            </Checkbox>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Status Tags */}
                    {tagGroups.status.length > 0 && (
                      <Box>
                        <Text fontWeight="bold" fontSize="xs" mb={2} color="green.600">
                          STATUS
                        </Text>
                        <VStack align="stretch" gap={1}>
                          {tagGroups.status.map((tag) => (
                            <Checkbox
                              key={tag._id}
                              checked={selectedTags.includes(tag._id)}
                              onCheckedChange={() => handleToggleTag(tag._id)}
                            >
                              <HStack>
                                <Box w={2} h={2} bg={tag.color} borderRadius="full" />
                                <Text fontSize="sm">{tag.name}</Text>
                              </HStack>
                            </Checkbox>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Custom Tags */}
                    {tagGroups.custom.length > 0 && (
                      <Box>
                        <Text fontWeight="bold" fontSize="xs" mb={2} color="gray.600">
                          CUSTOM
                        </Text>
                        <VStack align="stretch" gap={1}>
                          {tagGroups.custom.map((tag) => (
                            <Checkbox
                              key={tag._id}
                              checked={selectedTags.includes(tag._id)}
                              onCheckedChange={() => handleToggleTag(tag._id)}
                            >
                              <HStack>
                                <Box w={2} h={2} bg={tag.color} borderRadius="full" />
                                <Text fontSize="sm">{tag.name}</Text>
                              </HStack>
                            </Checkbox>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {getFilteredTags().length === 0 && (
                      <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                        No tags found
                      </Text>
                    )}
                  </VStack>
                )}
              </Popover.Body>
              <Popover.Footer>
                <Button size="sm" onClick={() => setIsOpen(false)} w="full">
                  Apply Filter
                </Button>
              </Popover.Footer>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Root>

        {/* Selected Tags Display */}
        {selectedTagObjects.map((tag) => (
          <Badge
            key={tag._id}
            colorScheme="pink"
            px={2}
            py={1}
            borderRadius="full"
            fontSize="xs"
            cursor="pointer"
            onClick={() => handleToggleTag(tag._id)}
            borderLeftWidth={2}
            borderLeftColor={tag.color}
            _hover={{ opacity: 0.7 }}
          >
            <HStack gap={1}>
              <Text>{tag.name}</Text>
              <Text fontSize="xs">×</Text>
            </HStack>
          </Badge>
        ))}
      </HStack>
    </Box>
  );
};

export default TagFilter;
