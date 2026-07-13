import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import User from '../../../models/User.js';
import Team from '../../../models/Team.js';
import Update from '../../../models/Update.js';
import { generateToken } from '../../../middleware/auth.js';
import { connectTestDB, closeTestDB, clearTestDB } from '../../setup/testDb.js';
import { createUserFixture, createDailyUpdateFixture } from '../../setup/fixtures.js';

describe('Teams API Integration Tests', () => {
  let authToken;
  let testUser;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    testUser = await User.create(
      createUserFixture({ email: 'teams-test@example.com', password: 'password123' })
    );
    authToken = generateToken(testUser._id);
  });

  afterEach(async () => {
    await clearTestDB();
  });

  const ownedTeam = () =>
    Team.create({
      name: 'My Team',
      owner: testUser._id,
      members: [{ userId: testUser._id, role: 'owner', joinedAt: new Date() }],
    });

  describe('POST /api/teams', () => {
    it('should create a team with the creator as owner', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Engineering', description: 'Eng team' })
        .expect(201);

      expect(res.body.data.name).toBe('Engineering');
      expect(res.body.data.owner.toString()).toBe(testUser._id.toString());
      expect(res.body.data.members[0].role).toBe('owner');
    });

    it('should reject a team without a name', async () => {
      await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'no name' })
        .expect(400);
    });

    it('should require authentication', async () => {
      await request(app).post('/api/teams').send({ name: 'X' }).expect(401);
    });
  });

  describe('GET /api/teams', () => {
    it('should list teams where the user is a member', async () => {
      await ownedTeam();
      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /api/teams/:id', () => {
    // Regression: getTeam must check membership BEFORE populating members.userId.
    // Populating first turns member.userId into a document, which breaks
    // isMember()'s ObjectId comparison and used to lock out legitimate members.
    it('returns the team for the owner, with populated owner and members', async () => {
      const team = await ownedTeam();
      const res = await request(app)
        .get(`/api/teams/${team._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data._id.toString()).toBe(team._id.toString());
      // members.userId and owner are populated to user documents with name/email
      expect(res.body.data.owner.email).toBe('teams-test@example.com');
      expect(res.body.data.members[0].userId.email).toBe('teams-test@example.com');
    });

    it('returns the team for a non-owner member (the previously broken case)', async () => {
      const member = await User.create(
        createUserFixture({ email: 'plain-member@example.com', password: 'password123' })
      );
      const memberToken = generateToken(member._id);
      const team = await Team.create({
        name: 'Shared',
        owner: testUser._id,
        members: [
          { userId: testUser._id, role: 'owner', joinedAt: new Date() },
          { userId: member._id, role: 'member', joinedAt: new Date() },
        ],
      });
      await request(app)
        .get(`/api/teams/${team._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);
    });

    it('should return 404 for a non-existent team', async () => {
      await request(app)
        .get('/api/teams/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 for a team the user is not a member of', async () => {
      const other = await User.create(
        createUserFixture({ email: 'other-team@example.com', password: 'password123' })
      );
      const team = await Team.create({
        name: 'Foreign',
        owner: other._id,
        members: [{ userId: other._id, role: 'owner', joinedAt: new Date() }],
      });
      await request(app)
        .get(`/api/teams/${team._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update a team as owner', async () => {
      const team = await ownedTeam();
      const res = await request(app)
        .put(`/api/teams/${team._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Renamed Team' })
        .expect(200);
      expect(res.body.data.name).toBe('Renamed Team');
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete a team as owner', async () => {
      const team = await ownedTeam();
      await request(app)
        .delete(`/api/teams/${team._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(await Team.findById(team._id)).toBeNull();
    });

    it('should reject deletion by a non-owner member', async () => {
      const owner = await User.create(
        createUserFixture({ email: 'real-owner@example.com', password: 'password123' })
      );
      const team = await Team.create({
        name: 'Owned by other',
        owner: owner._id,
        members: [
          { userId: owner._id, role: 'owner', joinedAt: new Date() },
          { userId: testUser._id, role: 'member', joinedAt: new Date() },
        ],
      });
      await request(app)
        .delete(`/api/teams/${team._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /api/teams/:id/members', () => {
    it('should add a member by email', async () => {
      const team = await ownedTeam();
      const newMember = await User.create(
        createUserFixture({ email: 'member@example.com', password: 'password123' })
      );
      const res = await request(app)
        .post(`/api/teams/${team._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'member@example.com', role: 'member' })
        .expect(200);
      expect(res.body.data.members.length).toBe(2);
      expect(
        res.body.data.members.some((m) => m.userId._id === newMember._id.toString())
      ).toBe(true);
    });

    it('should return 404 for an unknown email', async () => {
      const team = await ownedTeam();
      await request(app)
        .post(`/api/teams/${team._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'nobody@example.com' })
        .expect(404);
    });

    it('should reject adding a member without an email', async () => {
      const team = await ownedTeam();
      await request(app)
        .post(`/api/teams/${team._id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);
    });
  });

  describe('PUT /api/teams/:id/members/:userId', () => {
    it('should update a member role as owner', async () => {
      const member = await User.create(
        createUserFixture({ email: 'role-member@example.com', password: 'password123' })
      );
      const team = await Team.create({
        name: 'Role team',
        owner: testUser._id,
        members: [
          { userId: testUser._id, role: 'owner', joinedAt: new Date() },
          { userId: member._id, role: 'member', joinedAt: new Date() },
        ],
      });
      const res = await request(app)
        .put(`/api/teams/${team._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'admin' })
        .expect(200);
      const updated = res.body.data.members.find((m) => m.userId.toString() === member._id.toString());
      expect(updated.role).toBe('admin');
    });

    it('should reject an invalid role', async () => {
      const team = await ownedTeam();
      await request(app)
        .put(`/api/teams/${team._id}/members/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'superuser' })
        .expect(400);
    });
  });

  describe('DELETE /api/teams/:id/members/:userId', () => {
    it('should remove a member', async () => {
      const member = await User.create(
        createUserFixture({ email: 'remove-member@example.com', password: 'password123' })
      );
      const team = await Team.create({
        name: 'Remove team',
        owner: testUser._id,
        members: [
          { userId: testUser._id, role: 'owner', joinedAt: new Date() },
          { userId: member._id, role: 'member', joinedAt: new Date() },
        ],
      });
      const res = await request(app)
        .delete(`/api/teams/${team._id}/members/${member._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.members.length).toBe(1);
    });

    it('should not allow removing the owner', async () => {
      const team = await ownedTeam();
      await request(app)
        .delete(`/api/teams/${team._id}/members/${testUser._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/teams/:id/updates and /stats', () => {
    it('should return team updates shared with the team', async () => {
      const team = await ownedTeam();
      await Update.create(
        createDailyUpdateFixture(testUser._id, { teamId: team._id, visibility: 'team' })
      );
      const res = await request(app)
        .get(`/api/teams/${team._id}/updates`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.count).toBe(1);
    });

    it('should return team statistics', async () => {
      const team = await ownedTeam();
      await Update.create(
        createDailyUpdateFixture(testUser._id, { teamId: team._id, visibility: 'team' })
      );
      const res = await request(app)
        .get(`/api/teams/${team._id}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      expect(res.body.data.memberCount).toBe(1);
      expect(res.body.data.totalUpdates).toBe(1);
      expect(res.body.data.dailyUpdates).toBe(1);
    });
  });
});
