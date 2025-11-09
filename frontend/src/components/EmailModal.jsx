import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  Input,
  Text,
  HStack,
  Badge,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { emailAPI } from '../services/api';

/**
 * EmailModal Component
 * Modal for sending daily or weekly updates via email
 *
 * @param {boolean} isOpen - Modal open state
 * @param {function} onClose - Close modal callback
 * @param {object} update - Update object to send
 * @param {string} updateType - 'daily' or 'weekly'
 */
const EmailModal = ({ isOpen, onClose, update, updateType }) => {
  const [recipients, setRecipients] = useState(['']);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleAddRecipient = () => {
    setRecipients([...recipients, '']);
  };

  const handleRemoveRecipient = (index) => {
    const newRecipients = recipients.filter((_, i) => i !== index);
    setRecipients(newRecipients.length > 0 ? newRecipients : ['']);
  };

  const handleRecipientChange = (index, value) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const handleSendEmail = async () => {
    // Filter out empty recipients
    const validRecipients = recipients.filter(r => r.trim() !== '');

    if (validRecipients.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Please add at least one recipient email address',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validRecipients.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast({
        title: 'Invalid email addresses',
        description: `Please check: ${invalidEmails.join(', ')}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);

      if (updateType === 'daily') {
        await emailAPI.sendDailyUpdate(update._id, validRecipients);
      } else {
        await emailAPI.sendWeeklySummary(update._id, validRecipients);
      }

      toast({
        title: 'Email sent successfully',
        description: `Sent to ${validRecipients.length} recipient(s)`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset and close
      setRecipients(['']);
      onClose();
    } catch (error) {
      toast({
        title: 'Failed to send email',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRecipients(['']);
    onClose();
  };

  if (!update) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          📧 Send {updateType === 'daily' ? 'Daily Update' : 'Weekly Summary'} via Email
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack gap={4} align="stretch">
            {/* Update Preview */}
            <VStack align="start" bg="gray.50" p={4} borderRadius="md" gap={2}>
              <HStack>
                <Badge colorScheme={updateType === 'daily' ? 'blue' : 'green'}>
                  {updateType === 'daily' ? 'Daily Update' : 'Weekly Summary'}
                </Badge>
                {update.company && (
                  <Badge colorScheme="purple">{update.company.name}</Badge>
                )}
              </HStack>
              <Text fontSize="sm" color="gray.600" noOfLines={2}>
                {update.aiSummary || update.content}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {new Date(update.createdAt).toLocaleDateString()}
              </Text>
            </VStack>

            {/* Recipients */}
            <VStack align="stretch" gap={2}>
              <Text fontWeight="bold" fontSize="sm">
                Recipients *
              </Text>
              {recipients.map((recipient, index) => (
                <HStack key={index}>
                  <Input
                    placeholder="email@example.com"
                    value={recipient}
                    onChange={(e) => handleRecipientChange(index, e.target.value)}
                    type="email"
                  />
                  {recipients.length > 1 && (
                    <IconButton
                      aria-label="Remove recipient"
                      onClick={() => handleRemoveRecipient(index)}
                      variant="ghost"
                      colorScheme="red"
                      size="sm"
                    >
                      ✕
                    </IconButton>
                  )}
                </HStack>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddRecipient}
                alignSelf="flex-start"
              >
                + Add Recipient
              </Button>
            </VStack>

            <Text fontSize="xs" color="gray.500">
              * Emails will be sent to all recipients with a formatted version of this update
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={handleClose} mr={3}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSendEmail}
            isLoading={loading}
          >
            Send Email
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EmailModal;
