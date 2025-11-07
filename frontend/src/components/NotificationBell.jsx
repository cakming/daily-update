import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  VStack,
  HStack,
  Text,
  Badge,
  IconButton,
  useToast,
  Spinner,
  Link,
  Divider,
} from '@chakra-ui/react';
import { notificationAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * NotificationBell Component
 * Displays a bell icon with unread count badge and notification dropdown
 */
const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll({ limit: 10 });
      setNotifications(response.data.data);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count only
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
      setUnreadCount(0);
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
        duration: 3000,
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

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  // Fetch on mount and when opened
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

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

  return (
    <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement="bottom-end">
      <PopoverTrigger>
        <Button
          position="relative"
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="0"
              right="0"
              colorScheme="red"
              borderRadius="full"
              fontSize="xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent w="400px" maxW="90vw">
        <PopoverHeader>
          <HStack justifyContent="space-between">
            <Text fontWeight="bold">Notifications</Text>
            {unreadCount > 0 && (
              <Button size="xs" variant="ghost" onClick={handleMarkAllAsRead}>
                Mark all as read
              </Button>
            )}
          </HStack>
        </PopoverHeader>
        <PopoverBody maxH="400px" overflowY="auto" p={0}>
          {loading ? (
            <Box textAlign="center" py={8}>
              <Spinner size="md" />
            </Box>
          ) : notifications.length === 0 ? (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No notifications</Text>
            </Box>
          ) : (
            <VStack gap={0} align="stretch" divider={<Divider />}>
              {notifications.map((notification) => (
                <Box
                  key={notification._id}
                  p={3}
                  bg={notification.isRead ? 'white' : 'blue.50'}
                  cursor={notification.link ? 'pointer' : 'default'}
                  _hover={notification.link ? { bg: 'gray.50' } : {}}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <HStack align="start" gap={2}>
                    <Text fontSize="lg">
                      {getNotificationIcon(notification.type)}
                    </Text>
                    <VStack align="start" flex={1} gap={1}>
                      <HStack justifyContent="space-between" w="full">
                        <Text fontWeight="bold" fontSize="sm">
                          {notification.title}
                        </Text>
                        <IconButton
                          size="xs"
                          variant="ghost"
                          aria-label="Delete notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification._id);
                          }}
                        >
                          ✕
                        </IconButton>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        {notification.message}
                      </Text>
                      {notification.category && (
                        <Badge
                          colorScheme={getNotificationColor(notification.type)}
                          size="sm"
                        >
                          {notification.category}
                        </Badge>
                      )}
                      <Text fontSize="xs" color="gray.400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
        {notifications.length > 0 && (
          <PopoverFooter>
            <Button
              size="sm"
              variant="ghost"
              w="full"
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
            >
              View all notifications
            </Button>
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
