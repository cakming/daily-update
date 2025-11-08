import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Card,
  Text,
  useToast,
  Badge,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { teamAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { useRef } from 'react';

const Teams = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isAddMemberOpen, onOpen: onAddMemberOpen, onClose: onAddMemberClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = useRef();

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const response = await teamAPI.getAll();
      setTeams(response.data.data || []);
      if (response.data.data?.length > 0 && !selectedTeam) {
        setSelectedTeam(response.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: 'Failed to load teams',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Team name required',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await teamAPI.create(formData);
      toast({
        title: 'Team created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setFormData({ name: '', description: '' });
      onCreateClose();
      fetchTeams();
    } catch (error) {
      toast({
        title: 'Failed to create team',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) {
      toast({
        title: 'Email required',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSubmitting(true);
    try {
      await teamAPI.addMember(selectedTeam._id, {
        email: memberEmail,
        role: memberRole,
      });
      toast({
        title: 'Member added successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setMemberEmail('');
      setMemberRole('member');
      onAddMemberClose();
      fetchTeams();
    } catch (error) {
      toast({
        title: 'Failed to add member',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedTeam) return;

    try {
      await teamAPI.removeMember(selectedTeam._id, userId);
      toast({
        title: 'Member removed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchTeams();
    } catch (error) {
      toast({
        title: 'Failed to remove member',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamToDelete) return;

    setSubmitting(true);
    try {
      await teamAPI.delete(teamToDelete._id);
      toast({
        title: 'Team deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setTeamToDelete(null);
      onDeleteClose();
      fetchTeams();
      setSelectedTeam(null);
    } catch (error) {
      toast({
        title: 'Failed to delete team',
        description: error.response?.data?.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getUserRole = (team) => {
    if (team.owner._id === user._id || team.owner === user._id) return 'owner';
    const member = team.members?.find(m => m.userId._id === user._id || m.userId === user._id);
    return member?.role || null;
  };

  const canManageTeam = (team) => {
    const role = getUserRole(team);
    return role === 'owner' || role === 'admin';
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottomWidth="1px" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg" color="purple.600">
              Teams
            </Heading>
            <HStack gap={2}>
              <Button onClick={onCreateOpen} colorScheme="purple">
                Create Team
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Back to Dashboard
              </Button>
            </HStack>
          </HStack>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="7xl" py={8}>
        {loading ? (
          <Text>Loading teams...</Text>
        ) : teams.length === 0 ? (
          <Card p={8} textAlign="center">
            <VStack gap={4}>
              <Text fontSize="xl" color="gray.600">
                No teams yet
              </Text>
              <Text color="gray.500">
                Create your first team to start collaborating with others
              </Text>
              <Button onClick={onCreateOpen} colorScheme="purple">
                Create Your First Team
              </Button>
            </VStack>
          </Card>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
            {/* Team List */}
            <Box>
              <Heading size="md" mb={4}>
                Your Teams ({teams.length})
              </Heading>
              <VStack gap={3} align="stretch">
                {teams.map((team) => (
                  <Card
                    key={team._id}
                    p={4}
                    cursor="pointer"
                    onClick={() => setSelectedTeam(team)}
                    borderWidth="2px"
                    borderColor={selectedTeam?._id === team._id ? 'purple.500' : 'transparent'}
                    _hover={{ borderColor: 'purple.300' }}
                  >
                    <VStack align="start" gap={2}>
                      <HStack justify="space-between" w="full">
                        <Heading size="sm">{team.name}</Heading>
                        <Badge colorScheme={getUserRole(team) === 'owner' ? 'purple' : 'blue'}>
                          {getUserRole(team)}
                        </Badge>
                      </HStack>
                      {team.description && (
                        <Text fontSize="sm" color="gray.600" noOfLines={2}>
                          {team.description}
                        </Text>
                      )}
                      <HStack fontSize="xs" color="gray.500">
                        <Text>{team.members?.length || 0} members</Text>
                        <Text>•</Text>
                        <Text>Created {format(new Date(team.createdAt), 'MMM dd, yyyy')}</Text>
                      </HStack>
                    </VStack>
                  </Card>
                ))}
              </VStack>
            </Box>

            {/* Team Details */}
            <Box gridColumn={{ base: '1', lg: 'span 2' }}>
              {selectedTeam ? (
                <Card>
                  <Tabs colorScheme="purple">
                    <TabList px={6} pt={6}>
                      <Tab>Members</Tab>
                      <Tab>Settings</Tab>
                    </TabList>

                    <TabPanels>
                      {/* Members Tab */}
                      <TabPanel>
                        <VStack align="stretch" gap={4}>
                          <HStack justify="space-between">
                            <Heading size="md">Team Members</Heading>
                            {canManageTeam(selectedTeam) && (
                              <Button size="sm" onClick={onAddMemberOpen} colorScheme="purple">
                                Add Member
                              </Button>
                            )}
                          </HStack>

                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th>Name</Th>
                                <Th>Email</Th>
                                <Th>Role</Th>
                                <Th>Joined</Th>
                                {canManageTeam(selectedTeam) && <Th>Actions</Th>}
                              </Tr>
                            </Thead>
                            <Tbody>
                              {selectedTeam.members?.map((member) => (
                                <Tr key={member.userId._id || member.userId}>
                                  <Td>{member.userId.name || 'Unknown'}</Td>
                                  <Td>{member.userId.email || 'N/A'}</Td>
                                  <Td>
                                    <Badge colorScheme={member.role === 'owner' ? 'purple' : member.role === 'admin' ? 'blue' : 'gray'}>
                                      {member.role}
                                    </Badge>
                                  </Td>
                                  <Td>{format(new Date(member.joinedAt), 'MMM dd, yyyy')}</Td>
                                  {canManageTeam(selectedTeam) && (
                                    <Td>
                                      {member.role !== 'owner' && (
                                        <IconButton
                                          icon="🗑️"
                                          size="sm"
                                          variant="ghost"
                                          colorScheme="red"
                                          onClick={() => handleRemoveMember(member.userId._id || member.userId)}
                                          aria-label="Remove member"
                                        />
                                      )}
                                    </Td>
                                  )}
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </VStack>
                      </TabPanel>

                      {/* Settings Tab */}
                      <TabPanel>
                        <VStack align="stretch" gap={6}>
                          <Box>
                            <Heading size="md" mb={4}>
                              Team Information
                            </Heading>
                            <VStack align="stretch" gap={3}>
                              <Box>
                                <Text fontWeight="bold" fontSize="sm" color="gray.600">
                                  Team Name
                                </Text>
                                <Text fontSize="lg">{selectedTeam.name}</Text>
                              </Box>
                              {selectedTeam.description && (
                                <Box>
                                  <Text fontWeight="bold" fontSize="sm" color="gray.600">
                                    Description
                                  </Text>
                                  <Text>{selectedTeam.description}</Text>
                                </Box>
                              )}
                              <Box>
                                <Text fontWeight="bold" fontSize="sm" color="gray.600">
                                  Owner
                                </Text>
                                <Text>{selectedTeam.owner.name} ({selectedTeam.owner.email})</Text>
                              </Box>
                              <Box>
                                <Text fontWeight="bold" fontSize="sm" color="gray.600">
                                  Created
                                </Text>
                                <Text>{format(new Date(selectedTeam.createdAt), 'MMMM dd, yyyy')}</Text>
                              </Box>
                            </VStack>
                          </Box>

                          {getUserRole(selectedTeam) === 'owner' && (
                            <Box pt={6} borderTopWidth="1px">
                              <Heading size="md" mb={4} color="red.600">
                                Danger Zone
                              </Heading>
                              <Card bg="red.50" borderColor="red.200" borderWidth="1px" p={4}>
                                <VStack align="start" gap={2}>
                                  <Text fontWeight="bold" color="red.700">
                                    Delete Team
                                  </Text>
                                  <Text fontSize="sm" color="red.600">
                                    Once you delete a team, there is no going back. Please be certain.
                                  </Text>
                                  <Button
                                    colorScheme="red"
                                    size="sm"
                                    onClick={() => {
                                      setTeamToDelete(selectedTeam);
                                      onDeleteOpen();
                                    }}
                                  >
                                    Delete This Team
                                  </Button>
                                </VStack>
                              </Card>
                            </Box>
                          )}
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Card>
              ) : (
                <Card p={8} textAlign="center">
                  <Text color="gray.500">Select a team to view details</Text>
                </Card>
              )}
            </Box>
          </SimpleGrid>
        )}
      </Container>

      {/* Create Team Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Team</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleCreateTeam}>
            <ModalBody>
              <VStack gap={4}>
                <FormControl isRequired>
                  <FormLabel>Team Name</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Engineering Team"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your team"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCreateClose}>
                Cancel
              </Button>
              <Button colorScheme="purple" type="submit" isLoading={submitting}>
                Create Team
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Add Member Modal */}
      <Modal isOpen={isAddMemberOpen} onClose={onAddMemberClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Team Member</ModalHeader>
          <ModalCloseButton />
          <form onSubmit={handleAddMember}>
            <ModalBody>
              <VStack gap={4}>
                <FormControl isRequired>
                  <FormLabel>User Email</FormLabel>
                  <Input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    placeholder="user@example.com"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Role</FormLabel>
                  <Menu>
                    <MenuButton as={Button} w="full" textAlign="left">
                      {memberRole.charAt(0).toUpperCase() + memberRole.slice(1)}
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={() => setMemberRole('member')}>Member</MenuItem>
                      <MenuItem onClick={() => setMemberRole('admin')}>Admin</MenuItem>
                    </MenuList>
                  </Menu>
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAddMemberClose}>
                Cancel
              </Button>
              <Button colorScheme="purple" type="submit" isLoading={submitting}>
                Add Member
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Delete Team Confirmation */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Team
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{teamToDelete?.name}"? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteTeam} ml={3} isLoading={submitting}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default Teams;
