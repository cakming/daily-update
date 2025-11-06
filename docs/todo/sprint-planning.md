# Sprint Planning

**Last Updated:** 2025-11-06
**Sprint Duration:** 1 week (Monday - Friday)
**Team Size:** 1-2 developers

## Current Sprint: Sprint 2 (Nov 6-12, 2025)

### Sprint Goal
Complete testing infrastructure and achieve 80% test coverage for production readiness.

### Sprint Capacity
- 5 working days
- 2 developers × 6 hours/day = 60 hours total
- Buffer: 10% (6 hours)
- **Available: 54 hours**

### Sprint Backlog

| Task | Priority | Estimate | Assignee | Status |
|------|----------|----------|----------|--------|
| Backend test coverage completion | Critical | 16h | Dev 1 | In Progress |
| Frontend test coverage completion | Critical | 20h | Dev 2 | In Progress |
| Rate limiting implementation | High | 6h | Dev 1 | Pending |
| Input sanitization | High | 6h | Dev 1 | Pending |
| Error logging setup (Sentry) | High | 4h | Dev 2 | Pending |
| Code review & refactoring | Medium | 4h | Both | Pending |

**Total Estimated:** 56 hours (within capacity with small buffer)

### Daily Standup Schedule
- **Time:** 10:00 AM daily
- **Duration:** 15 minutes max
- **Format:**
  1. What did I complete yesterday?
  2. What am I working on today?
  3. Any blockers?

### Sprint Review (Nov 12, 2025)
- **Time:** 3:00 PM
- **Duration:** 1 hour
- **Attendees:** Development team, stakeholders
- **Agenda:**
  1. Demo completed features
  2. Review sprint metrics
  3. Gather feedback

### Sprint Retrospective (Nov 12, 2025)
- **Time:** 4:00 PM
- **Duration:** 1 hour
- **Attendees:** Development team
- **Topics:**
  1. What went well?
  2. What could be improved?
  3. Action items for next sprint

---

## Previous Sprints

### Sprint 1: Project Setup (Oct 30 - Nov 5, 2025)

**Sprint Goal:** ✅ Build MVP with core features

**Completed:**
- ✅ Project structure setup
- ✅ Backend API (authentication, CRUD)
- ✅ Frontend UI (all pages)
- ✅ MongoDB integration
- ✅ Claude API integration
- ✅ Testing infrastructure
- ✅ Documentation

**Not Completed:**
- ❌ Complete test coverage (moved to Sprint 2)
- ❌ Production deployment (moved to Sprint 3)

**Metrics:**
- **Velocity:** 85 story points
- **Completed:** 90% of planned items
- **Bugs Found:** 3 (all fixed)

**Retrospective Notes:**
- ✅ Good: Fast progress on core features
- ✅ Good: Clean code structure
- ⚠️ Improve: Need more test coverage earlier
- ⚠️ Improve: Better time estimates for AI integration

**Action Items:**
- Write tests alongside features (TDD)
- Add buffer time for external API integration
- Daily code reviews

---

## Next Sprint: Sprint 3 (Nov 13-19, 2025)

### Proposed Sprint Goal
Deploy to production and implement security enhancements.

### Proposed Backlog (To be refined)

| Task | Priority | Estimate | Notes |
|------|----------|----------|-------|
| Production deployment setup | Critical | 12h | Railway + Vercel |
| MongoDB Atlas configuration | Critical | 4h | Production database |
| Environment variables management | Critical | 3h | Secure configs |
| SSL/HTTPS setup | Critical | 3h | Security |
| Monitoring & alerts | High | 6h | Uptime monitoring |
| Performance testing | High | 8h | Load testing |
| Security audit | High | 8h | Vulnerability scan |
| Documentation updates | Medium | 4h | Deployment docs |

**Estimated Total:** 48 hours

### Sprint 3 Planning Meeting
- **Date:** Nov 12, 2025
- **Time:** 4:30 PM (after retrospective)
- **Duration:** 1 hour
- **Prepare:**
  - Review backlog
  - Refine story estimates
  - Check team capacity

---

## Sprint Template (For Future Sprints)

### Sprint X: [Sprint Name] (Date Range)

**Sprint Goal:** [One clear, achievable goal]

**Sprint Capacity:**
- X working days
- X developers × Y hours/day = Z hours total
- Buffer: 10%
- **Available: Z hours**

**Sprint Backlog:**

| Task | Priority | Estimate | Assignee | Status |
|------|----------|----------|----------|--------|
| Task 1 | | | | |
| Task 2 | | | | |

**Definition of Done:**
- [ ] Code complete
- [ ] Tests written and passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner approval

**Sprint Metrics:**
- **Planned Story Points:**
- **Completed Story Points:**
- **Velocity:**
- **Bugs Found:**
- **Bugs Fixed:**

---

## Sprint Planning Best Practices

### Before Planning

1. **Groom Backlog**
   - Review and prioritize features
   - Ensure stories are well-defined
   - Update estimates based on learnings

2. **Check Capacity**
   - Account for holidays, PTO
   - Consider other commitments
   - Be realistic about availability

3. **Review Previous Sprint**
   - What was velocity?
   - Any carryover items?
   - Lessons learned?

### During Planning

1. **Set Clear Goal**
   - One sentence sprint goal
   - Achievable and measurable
   - Aligned with project roadmap

2. **Break Down Stories**
   - Stories should be completable in sprint
   - If >2 days, break down further
   - Include tasks: dev, test, review, deploy

3. **Estimate as Team**
   - Use story points or hours
   - Consider complexity and effort
   - Include buffer for unknowns

4. **Commit as Team**
   - Don't overcommit
   - Agree on what's realistic
   - Leave room for unexpected work

### During Sprint

1. **Daily Standups**
   - Keep it brief (15 min)
   - Focus on blockers
   - Update task board

2. **Work in Priority Order**
   - High priority first
   - Finish before starting new
   - Limit work in progress

3. **Update Status**
   - Keep task board current
   - Log hours/progress
   - Communicate changes

4. **Ask for Help**
   - Don't wait until standup
   - Unblock yourself quickly
   - Collaborate on blockers

### After Sprint

1. **Review Meeting**
   - Demo completed work
   - Gather feedback
   - Celebrate wins

2. **Retrospective**
   - Honest feedback
   - Focus on improvement
   - Action items with owners

3. **Update Metrics**
   - Calculate velocity
   - Track trends
   - Adjust future planning

---

## Estimation Guide

### Story Points

| Points | Description | Example |
|--------|-------------|---------|
| 1 | Trivial, <2 hours | Add a button, fix typo |
| 2 | Simple, 2-4 hours | Add validation, simple UI change |
| 3 | Moderate, 4-8 hours | New API endpoint, new page |
| 5 | Complex, 1-2 days | Feature with frontend + backend |
| 8 | Very complex, 2-3 days | Complex feature with multiple components |
| 13 | Extremely complex, 3-5 days | Major feature, needs breaking down |
| 21+ | Too large | Break into smaller stories |

### Task Breakdown Example

**Feature: Password Reset**
- Backend API endpoint: 3 points
- Email service integration: 2 points
- Frontend reset page: 3 points
- Tests: 2 points
- Documentation: 1 point
- **Total: 11 points**

---

## Sprint Metrics Tracking

### Velocity Chart
Track completed story points per sprint to predict future capacity.

| Sprint | Planned | Completed | Velocity |
|--------|---------|-----------|----------|
| Sprint 1 | 90 | 85 | 85 |
| Sprint 2 | 56 | TBD | TBD |
| Sprint 3 | 48 | TBD | TBD |

**Average Velocity:** 85 (after Sprint 1)

### Burndown Chart
Track remaining work daily during sprint.

Day 1: 56 hours
Day 2: 48 hours
Day 3: 35 hours
Day 4: 20 hours
Day 5: 0 hours ✓

### Sprint Health Indicators

**Green:** On track
- Work progressing as planned
- No major blockers
- Team engaged

**Yellow:** At risk
- Behind schedule
- Some blockers
- Need to adjust

**Red:** Intervention needed
- Significantly behind
- Major blockers
- Sprint goal at risk

**Current Status:** 🟢 Green

---

## Team Capacity Planning

### Holidays & PTO (Upcoming)

| Date | Event | Impact |
|------|-------|--------|
| Nov 28-29 | Thanksgiving (US) | 2 days off |
| Dec 24-25 | Christmas | 2 days off |
| Dec 31-Jan 1 | New Year | 2 days off |

### Capacity Adjustments

**Normal Sprint:** 60 hours (2 devs × 6h/day × 5 days)
**Holiday Week:** Reduce by days off
**Buffer:** Always 10% for unexpected

---

## Sprint Ceremonies

### Sprint Planning
- **When:** First day of sprint
- **Duration:** 1-2 hours
- **Outcome:** Sprint backlog and goal

### Daily Standup
- **When:** Every morning
- **Duration:** 15 minutes
- **Outcome:** Daily sync and blocker identification

### Sprint Review
- **When:** Last day of sprint
- **Duration:** 1 hour
- **Outcome:** Demo and feedback

### Sprint Retrospective
- **When:** Last day of sprint (after review)
- **Duration:** 1 hour
- **Outcome:** Improvement actions

### Backlog Refinement
- **When:** Mid-sprint
- **Duration:** 30-60 minutes
- **Outcome:** Prepared backlog for next sprint

---

## Tools

- **Task Board:** GitHub Projects / Jira / Trello
- **Time Tracking:** Toggl / Harvest
- **Communication:** Slack / Discord
- **Documentation:** This repo /docs folder

---

**Next Planning Session:** Nov 12, 2025, 4:30 PM
