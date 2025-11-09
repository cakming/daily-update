import { useState, useEffect } from 'react';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  VStack,
  FormControl,
  FormLabel,
  Select,
  Text,
  Badge,
  HStack,
  Checkbox,
  CheckboxGroup,
  Stack,
  Box,
} from '@chakra-ui/react';
import { bulkAPI, tagAPI, companyAPI } from '../services/api';
import { useRef } from 'react';

const BulkOperations = ({ selectedIds, updateType, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Delete dialog
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Assign tags modal
  const { isOpen: isTagsOpen, onOpen: onTagsOpen, onClose: onTagsClose } = useDisclosure();
  const [tags, setTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  // Assign company modal
  const { isOpen: isCompanyOpen, onOpen: onCompanyOpen, onClose: onCompanyClose } = useDisclosure();
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  // Export modal
  const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();
  const [exportFormat, setExportFormat] = useState('json');

  const cancelRef = useRef();

  useEffect(() => {
    fetchTags();
    fetchCompanies();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await tagAPI.getAll();
      setTags(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyAPI.getAll();
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedIds.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one update',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    switch (action) {
      case 'delete':
        onDeleteOpen();
        break;
      case 'assign-tags':
        setSelectedTagIds([]);
        onTagsOpen();
        break;
      case 'assign-company':
        setSelectedCompanyId('');
        onCompanyOpen();
        break;
      case 'export':
        setExportFormat('json');
        onExportOpen();
        break;
      default:
        break;
    }
  };

  const confirmBulkDelete = async () => {
    setLoading(true);
    try {
      await bulkAPI.bulkDelete({
        ids: selectedIds,
        type: updateType,
      });

      toast({
        title: 'Bulk delete successful',
        description: `${selectedIds.length} update(s) deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onDeleteClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast({
        title: 'Bulk delete failed',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTags = async () => {
    if (selectedTagIds.length === 0) {
      toast({
        title: 'No tags selected',
        description: 'Please select at least one tag',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      await bulkAPI.assignTags(selectedIds, selectedTagIds);

      toast({
        title: 'Tags assigned successfully',
        description: `Tags assigned to ${selectedIds.length} update(s)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onTagsClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error assigning tags:', error);
      toast({
        title: 'Failed to assign tags',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCompany = async () => {
    setLoading(true);
    try {
      await bulkAPI.assignCompany(selectedIds, selectedCompanyId || null);

      toast({
        title: selectedCompanyId ? 'Company assigned successfully' : 'Company removed successfully',
        description: `Updated ${selectedIds.length} update(s)`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onCompanyClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error assigning company:', error);
      toast({
        title: 'Failed to assign company',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await bulkAPI.export(selectedIds, exportFormat);

      // Handle CSV format (blob response)
      if (exportFormat === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `updates-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON format
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `updates-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: 'Export successful',
        description: `Exported ${selectedIds.length} update(s) as ${exportFormat.toUpperCase()}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onExportClose();
    } catch (error) {
      console.error('Error exporting:', error);
      toast({
        title: 'Export failed',
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
    <>
      <Menu>
        <MenuButton
          as={Button}
          colorScheme="purple"
          variant="outline"
          isDisabled={selectedIds.length === 0}
          isLoading={loading}
        >
          ⚡ Bulk Actions ({selectedIds.length})
        </MenuButton>
        <MenuList>
          <MenuItem
            icon="🗑️"
            onClick={() => handleBulkAction('delete')}
            color="red.600"
          >
            Delete Selected
          </MenuItem>
          <MenuItem
            icon="🏷️"
            onClick={() => handleBulkAction('assign-tags')}
          >
            Assign Tags
          </MenuItem>
          <MenuItem
            icon="🏢"
            onClick={() => handleBulkAction('assign-company')}
          >
            Assign Company
          </MenuItem>
          <MenuItem
            icon="📥"
            onClick={() => handleBulkAction('export')}
          >
            Export Selected
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete {selectedIds.length} Update(s)
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete {selectedIds.length} selected update(s)?
              This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={confirmBulkDelete}
                ml={3}
                isLoading={loading}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Assign Tags Modal */}
      <Modal isOpen={isTagsOpen} onClose={onTagsClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Tags to {selectedIds.length} Update(s)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" gap={4}>
              <Text fontSize="sm" color="gray.600">
                Select tags to add to all selected updates. Existing tags will be preserved.
              </Text>
              {tags.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No tags available. Create tags first from the Tags page.
                </Text>
              ) : (
                <CheckboxGroup
                  value={selectedTagIds}
                  onChange={setSelectedTagIds}
                >
                  <Stack spacing={3}>
                    {tags.map((tag) => (
                      <Checkbox key={tag._id} value={tag._id}>
                        <HStack gap={2}>
                          <Badge
                            colorScheme={tag.color || 'gray'}
                            fontSize="sm"
                          >
                            {tag.name}
                          </Badge>
                          {tag.category && (
                            <Text fontSize="xs" color="gray.500">
                              ({tag.category})
                            </Text>
                          )}
                        </HStack>
                      </Checkbox>
                    ))}
                  </Stack>
                </CheckboxGroup>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onTagsClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleAssignTags}
              isLoading={loading}
              isDisabled={selectedTagIds.length === 0}
            >
              Assign Tags
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign Company Modal */}
      <Modal isOpen={isCompanyOpen} onClose={onCompanyClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Company to {selectedIds.length} Update(s)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" gap={4}>
              <Text fontSize="sm" color="gray.600">
                Select a company to assign to all selected updates. Leave empty to remove company assignment.
              </Text>
              <FormControl>
                <FormLabel>Company</FormLabel>
                <Select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  placeholder="None (Remove company)"
                >
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCompanyClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleAssignCompany}
              isLoading={loading}
            >
              {selectedCompanyId ? 'Assign Company' : 'Remove Company'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Export Modal */}
      <Modal isOpen={isExportOpen} onClose={onExportClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Export {selectedIds.length} Update(s)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" gap={4}>
              <Text fontSize="sm" color="gray.600">
                Choose a format to export the selected updates.
              </Text>
              <FormControl>
                <FormLabel>Export Format</FormLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="json">JSON - Full data with metadata</option>
                  <option value="csv">CSV - Spreadsheet format</option>
                </Select>
              </FormControl>
              <Box p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="xs" color="blue.800">
                  💡 Tip: JSON format includes all fields and metadata. CSV format is simplified for spreadsheet applications.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExportClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleExport}
              isLoading={loading}
            >
              Export {exportFormat.toUpperCase()}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BulkOperations;
