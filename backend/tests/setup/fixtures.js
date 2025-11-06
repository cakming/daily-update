import { faker } from '@faker-js/faker';

/**
 * Create user fixture data
 */
export const createUserFixture = (overrides = {}) => ({
  name: faker.person.fullName(),
  email: faker.internet.email().toLowerCase(),
  password: faker.internet.password({ length: 10 }),
  ...overrides
});

/**
 * Create multiple user fixtures
 */
export const createUsersFixture = (count = 5, overrides = {}) => {
  return Array.from({ length: count }, () => createUserFixture(overrides));
};

/**
 * Create daily update fixture data
 */
export const createDailyUpdateFixture = (userId, overrides = {}) => ({
  userId,
  type: 'daily',
  date: faker.date.recent({ days: 30 }),
  rawInput: faker.lorem.paragraph(),
  formattedOutput: generateFormattedDailyUpdate(),
  sections: {
    todaysProgress: [
      faker.lorem.sentence(),
      faker.lorem.sentence()
    ],
    ongoingWork: [
      faker.lorem.sentence()
    ],
    nextSteps: [
      faker.lorem.sentence()
    ],
    issues: [
      'No major issues reported'
    ]
  },
  ...overrides
});

/**
 * Create weekly update fixture data
 */
export const createWeeklyUpdateFixture = (userId, overrides = {}) => {
  const startDate = faker.date.recent({ days: 14 });
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return {
    userId,
    type: 'weekly',
    dateRange: {
      start: startDate,
      end: endDate
    },
    rawInput: faker.lorem.paragraphs(2),
    formattedOutput: generateFormattedWeeklyUpdate(),
    sections: {
      todaysProgress: [ // achievements
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence()
      ],
      ongoingWork: [ // initiatives
        faker.lorem.sentence(),
        faker.lorem.sentence()
      ],
      nextSteps: [ // next week focus
        faker.lorem.sentence()
      ],
      issues: [ // challenges
        'No major challenges this week'
      ]
    },
    ...overrides
  };
};

/**
 * Generate formatted daily update output
 */
function generateFormattedDailyUpdate() {
  const date = faker.date.recent().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `🗓️ Daily Update — ${date}

✅ Today's Progress
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}

🔄 Ongoing Work
- ${faker.lorem.sentence()}

📅 Next Steps (Tomorrow)
- ${faker.lorem.sentence()}

⚠️ Issues / Pending Items
No major issues reported`;
}

/**
 * Generate formatted weekly update output
 */
function generateFormattedWeeklyUpdate() {
  const start = faker.date.recent().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const end = new Date();
  end.setDate(end.getDate() + 7);
  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return `📊 Weekly Update — ${start} to ${endFormatted}

✅ This Week's Achievements
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}

🔄 Ongoing Initiatives
- ${faker.lorem.sentence()}
- ${faker.lorem.sentence()}

📅 Next Week's Focus
- ${faker.lorem.sentence()}

⚠️ Challenges & Action Items
No major challenges this week`;
}

/**
 * Create JWT token for testing
 */
export const generateTestToken = (userId) => {
  // This will use the actual token generation from auth middleware
  // Import it in your tests when needed
  return `test-token-${userId}`;
};

/**
 * Create complete user with hashed password for database insertion
 */
export const createUserForDB = async (User, overrides = {}) => {
  const userData = createUserFixture(overrides);
  const user = await User.create(userData);
  return user;
};

/**
 * Create test request headers with authentication
 */
export const createAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});
