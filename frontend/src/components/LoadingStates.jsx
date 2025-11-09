import {
  Box,
  Skeleton,
  SkeletonText,
  SkeletonCircle,
  VStack,
  HStack,
  Card,
  SimpleGrid,
  Spinner,
  Text,
} from '@chakra-ui/react';

/**
 * Full page loading spinner
 */
export const PageLoader = ({ message = 'Loading...' }) => (
  <Box
    minH="100vh"
    display="flex"
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
    gap={4}
  >
    <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
    <Text color="gray.600" fontSize="lg">
      {message}
    </Text>
  </Box>
);

/**
 * Card loading skeleton
 */
export const CardSkeleton = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, index) => (
      <Card.Root key={index} p={6}>
        <VStack align="stretch" gap={4}>
          <HStack justifyContent="space-between">
            <Skeleton height="24px" width="150px" />
            <SkeletonCircle size="8" />
          </HStack>
          <SkeletonText noOfLines={3} gap={2} />
          <HStack gap={2}>
            <Skeleton height="24px" width="60px" />
            <Skeleton height="24px" width="80px" />
          </HStack>
        </VStack>
      </Card.Root>
    ))}
  </>
);

/**
 * Table loading skeleton
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <Box>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <HStack key={rowIndex} gap={4} py={4} borderBottomWidth="1px">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} height="20px" flex={1} />
        ))}
      </HStack>
    ))}
  </Box>
);

/**
 * Stats card skeleton
 */
export const StatsSkeleton = ({ count = 4 }) => (
  <SimpleGrid columns={{ base: 1, md: 2, lg: count }} gap={4}>
    {Array.from({ length: count }).map((_, index) => (
      <Card.Root key={index} p={6}>
        <VStack align="start" gap={2}>
          <Skeleton height="16px" width="100px" />
          <Skeleton height="32px" width="80px" />
          <Skeleton height="14px" width="120px" />
        </VStack>
      </Card.Root>
    ))}
  </SimpleGrid>
);

/**
 * List item skeleton
 */
export const ListSkeleton = ({ count = 5 }) => (
  <VStack align="stretch" gap={3}>
    {Array.from({ length: count }).map((_, index) => (
      <HStack key={index} p={4} bg="gray.50" borderRadius="md" gap={4}>
        <SkeletonCircle size="12" />
        <VStack align="start" flex={1} gap={2}>
          <Skeleton height="18px" width="70%" />
          <Skeleton height="14px" width="90%" />
        </VStack>
        <Skeleton height="32px" width="80px" />
      </HStack>
    ))}
  </VStack>
);

/**
 * Form skeleton
 */
export const FormSkeleton = ({ fields = 4 }) => (
  <VStack align="stretch" gap={4}>
    {Array.from({ length: fields }).map((_, index) => (
      <Box key={index}>
        <Skeleton height="14px" width="100px" mb={2} />
        <Skeleton height="40px" width="100%" borderRadius="md" />
      </Box>
    ))}
    <HStack justifyContent="flex-end" gap={2} mt={4}>
      <Skeleton height="40px" width="100px" borderRadius="md" />
      <Skeleton height="40px" width="100px" borderRadius="md" />
    </HStack>
  </VStack>
);

/**
 * Chart skeleton
 */
export const ChartSkeleton = ({ height = '300px' }) => (
  <Box height={height} bg="gray.50" borderRadius="md" position="relative" overflow="hidden">
    <VStack h="full" justify="center" align="center">
      <Spinner size="lg" color="gray.400" />
      <Text color="gray.500" fontSize="sm">
        Loading chart...
      </Text>
    </VStack>
  </Box>
);

/**
 * Dashboard skeleton
 */
export const DashboardSkeleton = () => (
  <VStack align="stretch" gap={6}>
    <Box>
      <Skeleton height="32px" width="200px" mb={2} />
      <Skeleton height="20px" width="300px" />
    </Box>

    <StatsSkeleton count={4} />

    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
      <Card.Root p={6}>
        <Skeleton height="24px" width="150px" mb={4} />
        <ChartSkeleton height="250px" />
      </Card.Root>
      <Card.Root p={6}>
        <Skeleton height="24px" width="150px" mb={4} />
        <ChartSkeleton height="250px" />
      </Card.Root>
    </SimpleGrid>

    <Card.Root p={6}>
      <Skeleton height="24px" width="200px" mb={4} />
      <TableSkeleton rows={5} columns={4} />
    </Card.Root>
  </VStack>
);

/**
 * Profile skeleton
 */
export const ProfileSkeleton = () => (
  <VStack align="stretch" gap={6}>
    <HStack gap={4}>
      <SkeletonCircle size="24" />
      <VStack align="start" flex={1} gap={2}>
        <Skeleton height="28px" width="200px" />
        <Skeleton height="20px" width="250px" />
      </VStack>
    </HStack>

    <FormSkeleton fields={5} />
  </VStack>
);

/**
 * Notification skeleton
 */
export const NotificationSkeleton = ({ count = 5 }) => (
  <VStack align="stretch" gap={0} divider={<Box borderBottomWidth="1px" />}>
    {Array.from({ length: count }).map((_, index) => (
      <HStack key={index} p={4} align="start" gap={3}>
        <SkeletonCircle size="10" />
        <VStack align="start" flex={1} gap={2}>
          <Skeleton height="18px" width="80%" />
          <Skeleton height="14px" width="100%" />
          <Skeleton height="12px" width="100px" />
        </VStack>
      </HStack>
    ))}
  </VStack>
);

/**
 * Empty state (not loading, but no data)
 */
export const EmptyState = ({ icon = '📭', title, description, action }) => (
  <Box textAlign="center" py={12}>
    <Text fontSize="6xl" mb={4}>
      {icon}
    </Text>
    <Text fontSize="2xl" fontWeight="bold" mb={2} color="gray.700">
      {title}
    </Text>
    <Text color="gray.600" mb={6}>
      {description}
    </Text>
    {action}
  </Box>
);

/**
 * Loading overlay (for cards or sections)
 */
export const LoadingOverlay = ({ message = 'Loading...' }) => (
  <Box
    position="absolute"
    top={0}
    left={0}
    right={0}
    bottom={0}
    bg="whiteAlpha.900"
    display="flex"
    alignItems="center"
    justifyContent="center"
    flexDirection="column"
    gap={3}
    zIndex={10}
    borderRadius="md"
  >
    <Spinner size="lg" thickness="3px" speed="0.65s" color="blue.500" />
    <Text color="gray.600" fontSize="sm">
      {message}
    </Text>
  </Box>
);

/**
 * Button loading state
 */
export const ButtonSpinner = () => <Spinner size="sm" mr={2} />;

/**
 * Inline loader (for inline content)
 */
export const InlineLoader = ({ size = 'sm', text = '' }) => (
  <HStack gap={2}>
    <Spinner size={size} />
    {text && <Text fontSize="sm" color="gray.600">{text}</Text>}
  </HStack>
);

export default {
  PageLoader,
  CardSkeleton,
  TableSkeleton,
  StatsSkeleton,
  ListSkeleton,
  FormSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
  ProfileSkeleton,
  NotificationSkeleton,
  EmptyState,
  LoadingOverlay,
  ButtonSpinner,
  InlineLoader,
};
