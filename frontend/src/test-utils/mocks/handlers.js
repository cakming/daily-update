import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:5000/api';

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        {
          success: false,
          message: 'User already exists with this email'
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        _id: 'mock-user-id',
        name: body.name,
        email: body.email,
        token: 'mock-jwt-token'
      }
    }, { status: 201 });
  }),

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const body = await request.json();

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        data: {
          _id: 'mock-user-id',
          name: 'Test User',
          email: 'test@example.com',
          token: 'mock-jwt-token'
        }
      });
    }

    return HttpResponse.json(
      {
        success: false,
        message: 'Invalid credentials'
      },
      { status: 401 }
    );
  }),

  http.get(`${API_URL}/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          success: false,
          message: 'Not authorized, no token'
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        _id: 'mock-user-id',
        name: 'Test User',
        email: 'test@example.com'
      }
    });
  }),

  // Daily Updates handlers
  http.post(`${API_URL}/daily-updates`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        _id: 'mock-update-id',
        userId: 'mock-user-id',
        type: 'daily',
        date: body.date,
        rawInput: body.rawInput,
        formattedOutput: `🗓️ Daily Update — ${new Date(body.date).toLocaleDateString()}

✅ Today's Progress
- Completed mock feature
- Fixed mock bug

🔄 Ongoing Work
- Working on mock task

📅 Next Steps (Tomorrow)
- Plan next mock feature

⚠️ Issues / Pending Items
No major issues reported`,
        sections: {
          todaysProgress: ['Completed mock feature', 'Fixed mock bug'],
          ongoingWork: ['Working on mock task'],
          nextSteps: ['Plan next mock feature'],
          issues: ['No major issues reported']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }, { status: 201 });
  }),

  http.get(`${API_URL}/daily-updates`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');

    const mockUpdates = [
      {
        _id: '1',
        userId: 'mock-user-id',
        type: 'daily',
        date: new Date().toISOString(),
        rawInput: 'Fixed bug in auth',
        formattedOutput: '🗓️ Daily Update...',
        sections: {},
        createdAt: new Date().toISOString()
      }
    ];

    return HttpResponse.json({
      success: true,
      count: mockUpdates.length,
      data: mockUpdates
    });
  }),

  http.delete(`${API_URL}/daily-updates/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Daily update deleted successfully'
    });
  }),

  // Weekly Updates handlers
  http.post(`${API_URL}/weekly-updates/generate`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        formattedOutput: `📊 Weekly Update — ${new Date(body.startDate).toLocaleDateString()} to ${new Date(body.endDate).toLocaleDateString()}

✅ This Week's Achievements
- Completed multiple features
- Resolved several bugs

🔄 Ongoing Initiatives
- Continuing development

📅 Next Week's Focus
- Plan new features

⚠️ Challenges & Action Items
No major challenges this week`,
        sections: {
          todaysProgress: ['Completed multiple features', 'Resolved several bugs'],
          ongoingWork: ['Continuing development'],
          nextSteps: ['Plan new features'],
          issues: ['No major challenges this week']
        },
        dailyUpdatesUsed: 5
      }
    });
  }),

  http.post(`${API_URL}/weekly-updates`, async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      success: true,
      data: {
        _id: 'mock-weekly-update-id',
        userId: 'mock-user-id',
        type: 'weekly',
        dateRange: {
          start: body.startDate,
          end: body.endDate
        },
        rawInput: body.rawInput,
        formattedOutput: body.formattedOutput,
        sections: body.sections,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });
  }),

  http.get(`${API_URL}/weekly-updates`, () => {
    return HttpResponse.json({
      success: true,
      count: 0,
      data: []
    });
  }),

  http.delete(`${API_URL}/weekly-updates/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      message: 'Weekly update deleted successfully'
    });
  })
];
