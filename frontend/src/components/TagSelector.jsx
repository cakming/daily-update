import { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Input,
  FormControl,
  FormLabel,
  Popover,
  SimpleGrid,
  Checkbox,
  useToast,
} from '@chakra-ui/react';
import { tagAPI } from '../services/api';

/**
 * TagSelector Component
 * Multi-select component for choosing tags
 *
 * @param {Array} selectedTags - Array of selected tag IDs
 * @param {Function} onChange - Callback when selection changes
 * @param {String} category - Optional: Filter tags by category
 */
const TagSelector = ({ selectedTags = [], onChange }) => {
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
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleRemoveTag = (tagId) => {
    onChange(selectedTags.filter((id) => id !== tagId));
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
    <FormControl>
      <FormLabel>Tags</FormLabel>

      {/* Selected Tags Display */}
      <Box
        minH="48px"
        p={2}
        borderWidth="1px"
        borderRadius="md"
        bg="white"
        mb={2}
      >
        {selectedTagObjects.length > 0 ? (
          <HStack flexWrap="wrap" gap={2}>
            {selectedTagObjects.map((tag) => (
              <Badge
                key={tag._id}
                colorScheme="pink"
                px={3}
                py={1}
                borderRadius="full"
                fontSize="sm"
                cursor="pointer"
                onClick={() => handleRemoveTag(tag._id)}
                borderLeftWidth={3}
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
        ) : (
          <Text color="gray.500" fontSize="sm">
            No tags selected
          </Text>
        )}
      </Box>

      {/* Tag Selector Popover */}
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <Button variant="outline" w="full">
            Select Tags
          </Button>
        </Popover.Trigger>
        <Popover.Positioner>
          <Popover.Content minW="400px" maxW="500px">
            <Popover.Header>
              <VStack align="stretch" gap={2}>
                <Text fontWeight="bold">Select Tags</Text>
                <Input
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="sm"
                />
              </VStack>
            </Popover.Header>
            <Popover.Body maxH="400px" overflowY="auto">
              {loading ? (
                <Text>Loading tags...</Text>
              ) : (
                <VStack align="stretch" gap={4}>
                  {/* Project Tags */}
                  {tagGroups.project.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" mb={2} color="blue.600">
                        Project Tags
                      </Text>
                      <VStack align="stretch" gap={1}>
                        {tagGroups.project.map((tag) => (
                          <Checkbox
                            key={tag._id}
                            checked={selectedTags.includes(tag._id)}
                            onCheckedChange={() => handleToggleTag(tag._id)}
                          >
                            <HStack>
                              <Box w={3} h={3} bg={tag.color} borderRadius="full" />
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
                      <Text fontWeight="bold" fontSize="sm" mb={2} color="red.600">
                        Priority Tags
                      </Text>
                      <VStack align="stretch" gap={1}>
                        {tagGroups.priority.map((tag) => (
                          <Checkbox
                            key={tag._id}
                            checked={selectedTags.includes(tag._id)}
                            onCheckedChange={() => handleToggleTag(tag._id)}
                          >
                            <HStack>
                              <Box w={3} h={3} bg={tag.color} borderRadius="full" />
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
                      <Text fontWeight="bold" fontSize="sm" mb={2} color="green.600">
                        Status Tags
                      </Text>
                      <VStack align="stretch" gap={1}>
                        {tagGroups.status.map((tag) => (
                          <Checkbox
                            key={tag._id}
                            checked={selectedTags.includes(tag._id)}
                            onCheckedChange={() => handleToggleTag(tag._id)}
                          >
                            <HStack>
                              <Box w={3} h={3} bg={tag.color} borderRadius="full" />
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
                      <Text fontWeight="bold" fontSize="sm" mb={2} color="gray.600">
                        Custom Tags
                      </Text>
                      <VStack align="stretch" gap={1}>
                        {tagGroups.custom.map((tag) => (
                          <Checkbox
                            key={tag._id}
                            checked={selectedTags.includes(tag._id)}
                            onCheckedChange={() => handleToggleTag(tag._id)}
                          >
                            <HStack>
                              <Box w={3} h={3} bg={tag.color} borderRadius="full" />
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
                Done
              </Button>
            </Popover.Footer>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Root>

      <Text fontSize="xs" color="gray.500" mt={1}>
        Click on selected tags to remove them
      </Text>
    </FormControl>
  );
};

export default TagSelector;
