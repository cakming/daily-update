import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import Team from '../../../models/Team.js';

const ownerId = new mongoose.Types.ObjectId();
const memberId = new mongoose.Types.ObjectId();
const strangerId = new mongoose.Types.ObjectId();

const buildTeam = (overrides = {}) => ({
  name: 'Test Team',
  owner: ownerId,
  members: [{ userId: ownerId, role: 'owner', joinedAt: new Date() }],
  ...overrides,
});

describe('Team Model', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  describe('validation', () => {
    it('should create a team with valid data', async () => {
      const team = await Team.create(buildTeam());
      expect(team.name).toBe('Test Team');
      expect(team.owner.toString()).toBe(ownerId.toString());
      expect(team.settings.visibility).toBe('private');
      expect(team.settings.allowMemberInvites).toBe(false);
    });

    it('should require a name', async () => {
      await expect(Team.create(buildTeam({ name: undefined }))).rejects.toThrow();
    });

    it('should reject a name longer than 100 characters', async () => {
      await expect(Team.create(buildTeam({ name: 'a'.repeat(101) }))).rejects.toThrow();
    });

    it('should default a member role to member', async () => {
      const team = await Team.create(
        buildTeam({
          members: [
            { userId: ownerId, role: 'owner', joinedAt: new Date() },
            { userId: memberId },
          ],
        })
      );
      const added = team.members.find((m) => m.userId.toString() === memberId.toString());
      expect(added.role).toBe('member');
    });

    it('should update updatedAt on save', async () => {
      const team = await Team.create(buildTeam());
      const original = team.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 5));
      team.name = 'Renamed';
      await team.save();
      expect(team.updatedAt.getTime()).toBeGreaterThanOrEqual(original);
    });
  });

  describe('methods', () => {
    let team;

    beforeAll(async () => {
      // no-op; team built per test
    });

    it('isMember should detect owners and members', async () => {
      team = await Team.create(
        buildTeam({
          members: [
            { userId: ownerId, role: 'owner', joinedAt: new Date() },
            { userId: memberId, role: 'member', joinedAt: new Date() },
          ],
        })
      );
      expect(team.isMember(ownerId)).toBe(true);
      expect(team.isMember(memberId)).toBe(true);
      expect(team.isMember(strangerId)).toBe(false);
    });

    it('isAdminOrOwner should be true for owner and admins only', async () => {
      team = await Team.create(
        buildTeam({
          members: [
            { userId: ownerId, role: 'owner', joinedAt: new Date() },
            { userId: memberId, role: 'admin', joinedAt: new Date() },
            { userId: strangerId, role: 'member', joinedAt: new Date() },
          ],
        })
      );
      expect(team.isAdminOrOwner(ownerId)).toBe(true);
      expect(team.isAdminOrOwner(memberId)).toBe(true);
      expect(team.isAdminOrOwner(strangerId)).toBe(false);
    });

    it('getUserRole should return the role or null', async () => {
      team = await Team.create(
        buildTeam({
          members: [
            { userId: ownerId, role: 'owner', joinedAt: new Date() },
            { userId: memberId, role: 'member', joinedAt: new Date() },
          ],
        })
      );
      expect(team.getUserRole(ownerId)).toBe('owner');
      expect(team.getUserRole(memberId)).toBe('member');
      expect(team.getUserRole(strangerId)).toBeNull();
    });
  });
});
