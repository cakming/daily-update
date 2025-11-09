import { useState, useEffect } from 'react';
import {
  FormControl,
  FormLabel,
  Select,
  HStack,
  Switch,
  Text,
  useToast,
  VStack,
  Badge,
} from '@chakra-ui/react';
import { teamAPI } from '../services/api';

const TeamSelector = ({ selectedTeamId, onTeamChange, visibility, onVisibilityChange }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await teamAPI.getAll();
      setTeams(response.data.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Failed to load teams',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack align="stretch" gap={3}>
      <FormControl>
        <FormLabel>Share with Team (Optional)</FormLabel>
        <Select
          value={selectedTeamId || ''}
          onChange={(e) => {
            const teamId = e.target.value || null;
            onTeamChange(teamId);
            // Auto-enable team visibility if a team is selected
            if (teamId && visibility !== 'team') {
              onVisibilityChange('team');
            } else if (!teamId) {
              onVisibilityChange('private');
            }
          }}
          placeholder="None (Private)"
          isDisabled={loading}
        >
          {teams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name} ({team.members?.length || 0} members)
            </option>
          ))}
        </Select>
      </FormControl>

      {selectedTeamId && (
        <FormControl>
          <HStack justify="space-between">
            <VStack align="start" gap={0}>
              <Text fontSize="sm" fontWeight="medium">
                Visibility
              </Text>
              <Text fontSize="xs" color="gray.600">
                {visibility === 'team'
                  ? 'Team members can see this update'
                  : 'Only you can see this update'}
              </Text>
            </VStack>
            <HStack>
              <Badge colorScheme={visibility === 'team' ? 'green' : 'gray'}>
                {visibility === 'team' ? 'Team' : 'Private'}
              </Badge>
              <Switch
                colorScheme="purple"
                isChecked={visibility === 'team'}
                onChange={(e) => onVisibilityChange(e.target.checked ? 'team' : 'private')}
              />
            </HStack>
          </HStack>
        </FormControl>
      )}

      {teams.length === 0 && !loading && (
        <Text fontSize="sm" color="gray.500">
          You haven't joined any teams yet. Create or join a team to share updates.
        </Text>
      )}
    </VStack>
  );
};

export default TeamSelector;
