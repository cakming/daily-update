import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Spinner,
  Divider,
} from '@chakra-ui/react';
import { publicAPI } from '../services/api';

/**
 * PublicUpdate
 * Read-only, unauthenticated view of a shared weekly summary, reached via
 * /share/:token. Renders only the presentation fields the public endpoint
 * returns.
 */
const PublicUpdate = () => {
  const { token } = useParams();
  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await publicAPI.getSharedUpdate(token);
        if (active) setUpdate(response.data.data);
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  if (loading) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" />
      </Box>
    );
  }

  if (notFound || !update) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={2}>
          <Heading size="lg">Link not found</Heading>
          <Text color="gray.600">This shared update is unavailable or sharing was turned off.</Text>
        </VStack>
      </Box>
    );
  }

  const period =
    update.dateRange?.start && update.dateRange?.end
      ? `${new Date(update.dateRange.start).toLocaleDateString()} – ${new Date(
          update.dateRange.end
        ).toLocaleDateString()}`
      : update.date
      ? new Date(update.date).toLocaleDateString()
      : '';

  return (
    <Box minH="100vh" bg="gray.50" py={{ base: 6, md: 12 }}>
      <Container maxW="3xl">
        <Box bg="white" borderRadius="lg" boxShadow="sm" p={{ base: 6, md: 10 }}>
          <VStack align="stretch" gap={5}>
            <VStack align="start" gap={2}>
              <HStack gap={2}>
                <Badge colorScheme={update.type === 'weekly' ? 'green' : 'blue'}>
                  {update.title || (update.type === 'weekly' ? 'Weekly Summary' : 'Daily Update')}
                </Badge>
                {update.company && <Badge colorScheme="purple">{update.company}</Badge>}
              </HStack>
              <Heading size="lg">{update.title || 'Update'}</Heading>
              {period && (
                <Text color="gray.500" fontSize="sm">
                  {period}
                </Text>
              )}
            </VStack>

            <Divider />

            <Text whiteSpace="pre-wrap" lineHeight="1.7">
              {update.formattedOutput}
            </Text>

            {update.tags?.length > 0 && (
              <HStack gap={2} flexWrap="wrap">
                {update.tags.map((tag) => (
                  <Badge key={tag} colorScheme="cyan" variant="subtle">
                    {tag}
                  </Badge>
                ))}
              </HStack>
            )}

            <Divider />
            <Text fontSize="xs" color="gray.400" textAlign="center">
              Shared via Daily Update
            </Text>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicUpdate;
