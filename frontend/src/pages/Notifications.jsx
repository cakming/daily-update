import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Select,
  
  Spinner,
  Divider,
  IconButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useToast,
} from '@chakra-ui/react';
import { notificationAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';

/**
 * Notifications Page
 * Full page view of all notifications with filtering and management
 */
const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [categoryFilter, setCategoryFilter] = useState('all');
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'unread') params.isRead = false;
      if (filter === 'read') params.isRead = true;

      const response = await notificationAPI.getAll(params);
      let filteredData = response.data.data;

      // Apply category filter
      if (categoryFilter !== 'all') {
        filteredData = filteredData.filter(n => n.category === categoryFilter);
      }

      setNotifications(filteredData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      toast({
        title: 'Success',
        description: 'Notification marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Delete notification
  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast({
        title: 'Success',
        description: 'Notification deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Clear all read notifications
  const handleClearRead = async () => {
    try {
      await notificationAPI.clearRead();
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      onClose();
      toast({
        title: 'Success',
        description: 'All read notifications cleared',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear read notifications',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchNotifications();
  }, [filter, categoryFilter]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  // Get color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'green';
      case 'warning':
        return 'orange';
      case 'error':
        return 'red';
      case 'info':
      default:
        return 'blue';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Container maxW="container.lg" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            🔔 Notifications
          </Heading>
          <Text color="gray.600">
            Manage your notifications and stay updated
          </Text>
        </Box>

        {/* Filters and Actions */}
        <HStack justifyContent="space-between" flexWrap="wrap" gap={4}>
          <HStack gap={4} flexWrap="wrap">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              w="auto"
              minW="150px"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread ({unreadCount})</option>
              <option value="read">Read</option>
            </Select>

            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              w="auto"
              minW="150px"
            >
              <option value="all">All Categories</option>
              <option value="system">System</option>
              <option value="update">Update</option>
              <option value="reminder">Reminder</option>
              <option value="achievement">Achievement</option>
              <option value="other">Other</option>
            </Select>
          </HStack>

          <HStack gap={2}>
            {unreadCount > 0 && (
              <Button size="sm" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
            <Button size="sm" colorScheme="red" variant="outline" onClick={onOpen}>
              Clear read
            </Button>
          </HStack>
        </HStack>

        {/* Notifications List */}
        {loading ? (
          <Box textAlign="center" py={12}>
            <Spinner size="xl" />
            <Text mt={4} color="gray.600">
              Loading notifications...
            </Text>
          </Box>
        ) : notifications.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Text fontSize="4xl" mb={4}>
              📭
            </Text>
            <Heading size="md" mb={2}>
              No notifications
            </Heading>
            <Text color="gray.600">
              {filter === 'unread'
                ? "You're all caught up! No unread notifications."
                : 'You have no notifications at this time.'}
            </Text>
          </Box>
        ) : (
          <VStack gap={0} align="stretch" borderWidth="1px" borderRadius="lg" overflow="hidden">
            {notifications.map((notification, index) => (
              <Box
                key={notification._id}
                p={4}
                bg={notification.isRead ? 'white' : 'blue.50'}
                borderBottomWidth={index < notifications.length - 1 ? '1px' : '0'}
                cursor={notification.link ? 'pointer' : 'default'}
                _hover={notification.link ? { bg: 'gray.50' } : {}}
                onClick={() => handleNotificationClick(notification)}
                transition="background 0.2s"
              >
                <HStack align="start" gap={3}>
                  <Text fontSize="2xl">
                    {getNotificationIcon(notification.type)}
                  </Text>
                  <VStack align="start" flex={1} gap={2}>
                    <HStack justifyContent="space-between" w="full">
                      <Text fontWeight="bold" fontSize="md">
                        {notification.title}
                      </Text>
                      <HStack gap={2}>
                        {!notification.isRead && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification._id);
                            }}
                          >
                            Mark as read
                          </Button>
                        )}
                        <IconButton
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          aria-label="Delete notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                          }}
                        >
                          🗑️
                        </IconButton>
                      </HStack>
                    </HStack>
                    <Text fontSize="sm" color="gray.700">
                      {notification.message}
                    </Text>
                    <HStack gap={2}>
                      <Badge
                        colorScheme={getNotificationColor(notification.type)}
                        size="sm"
                      >
                        {notification.category}
                      </Badge>
                      {!notification.isRead && (
                        <Badge colorScheme="blue" size="sm">
                          New
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="xs" color="gray.400">
                      {new Date(notification.createdAt).toLocaleString()}
                    </Text>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        )}
      </VStack>

      {/* Clear Read Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Clear Read Notifications
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete all read notifications? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleClearRead} ml={3}>
                Clear Read
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  );
};

export default Notifications;
