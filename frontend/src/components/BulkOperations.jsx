import { useState } from 'react';
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
  useDisclosure,
  HStack,
  Text,
} from '@chakra-ui/react';
import { bulkAPI } from '../services/api';
import { useRef } from 'react';

const BulkOperations = ({ selectedIds, updateType, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingAction, setPendingAction] = useState(null);
  const cancelRef = useRef();

  const handleBulkAction = async (action) => {
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

    // For delete action, show confirmation
    if (action === 'delete') {
      setPendingAction('delete');
      onOpen();
      return;
    }

    // For other actions, show toast indicating they need input
    toast({
      title: 'Feature coming soon',
      description: `Bulk ${action} will be available in the next update`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
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

      onClose();
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

      {/* Confirmation Dialog for Delete */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
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
              <Button ref={cancelRef} onClick={onClose}>
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
    </>
  );
};

export default BulkOperations;
