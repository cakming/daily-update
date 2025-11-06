# Daily Update App

A professional client communication tool that transforms technical team updates into client-friendly daily and weekly reports using AI.

[![Production Ready](https://img.shields.io/badge/status-production%20ready-success)](./PRODUCTION_SETUP.md)
[![Test Coverage](https://img.shields.io/badge/coverage-71%25-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## 🚀 Production Ready

This app is **production-ready** and can be deployed in ~15 minutes!

- ✅ Complete feature set with AI-powered updates
- ✅ Comprehensive test coverage (71% backend, E2E tests)
- ✅ Security hardened (JWT, rate limiting, CORS)
- ✅ Full deployment documentation
- ✅ Error tracking configured (Sentry)
- ✅ Estimated cost: $5-15/month

**Quick Deploy:** See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) or [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

## Overview

The Daily Update App helps you:
- Convert technical jargon into user-friendly language
- Generate formatted daily updates with emojis and clear sections
- Create weekly summaries from daily updates
- **Export in multiple formats** (CSV, JSON, Markdown, PDF)
- **Use templates** for common update patterns
- **Dark mode** for comfortable viewing
- Track productivity with analytics dashboard
- Manage multiple companies/clients
- Maintain historical records of all communications
- Streamline client communication workflow

## Tech Stack

### Frontend
- React with Vite
- Chakra UI v3 for styling
- React Router for navigation
- Axios for API calls
- date-fns for date formatting

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT authentication
- Claude API (Anthropic) for AI text processing
- bcryptjs for password hashing

## 📚 Documentation

- **[PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md)** - Quick 5-minute deployment guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Complete deployment checklist (80+ items)
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Commands and URLs reference
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment documentation

## ✨ Features

### Core Features (Production Ready)

1. **Authentication System**
   - Secure email/password registration and login
   - JWT-based session management
   - Protected routes

2. **Daily Update Creation**
   - Custom date selection (supports backdating and future dates)
   - AI-powered rewriting using Claude API (Anthropic Claude)
   - Formatted output with emojis and sections
   - **Template support** - Save and reuse common update formats
   - Copy to clipboard functionality
   - Auto-save to database

3. **Weekly Update Generation**
   - Date range selection
   - Automatic aggregation of daily updates
   - AI-powered summarization
   - Manual input option

4. **Company/Client Management**
   - Create and manage multiple companies
   - Assign updates to specific clients
   - Filter updates by company
   - Color-coded organization
   - Company statistics and insights

5. **Update Templates**
   - Create reusable update templates
   - Categorize templates by type (daily/weekly)
   - Track template usage statistics
   - Quick template loading in update creation
   - Search and filter templates

6. **Export & Analytics**
   - **Export formats**: CSV, JSON, Markdown, **PDF**
   - Date range and company filtering
   - Analytics dashboard with charts
   - Productivity trends and insights
   - Update frequency tracking

7. **Historical Management**
   - List view of all updates (daily and weekly)
   - Advanced search and filtering
   - View/Edit/Delete capabilities
   - Organized by date and company
   - Bulk operations

8. **UI/UX Features**
   - **Dark mode** with system-wide theme switching
   - Responsive design for mobile and desktop
   - Intuitive navigation
   - Real-time feedback
   - Accessibility support

### Output Format

**Daily Updates:**
```
🗓️ Daily Update — [Date]

✅ Today's Progress
[Bullet points of completed work]

🔄 Ongoing Work
[Bullet points of in-progress items]

📅 Next Steps (Tomorrow)
[Bullet points of planned work]

⚠️ Issues / Pending Items
[Any blockers or concerns]
```

**Weekly Updates:**
```
📊 Weekly Update — [Start Date] to [End Date]

✅ This Week's Achievements
[Summarized completed work]

🔄 Ongoing Initiatives
[Consolidated in-progress items]

📅 Next Week's Focus
[Planned work for upcoming week]

⚠️ Challenges & Action Items
[Any blockers or concerns]
```

## Project Structure

```
daily-update/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── dailyUpdateController.js
│   │   └── weeklyUpdateController.js
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User schema
│   │   └── Update.js            # Update schema (daily/weekly)
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dailyUpdates.js
│   │   └── weeklyUpdates.js
│   ├── services/
│   │   └── claudeService.js     # Claude API integration
│   ├── .env                     # Environment variables
│   ├── .env.example
│   ├── package.json
│   └── server.js                # Main server file
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── CreateDailyUpdate.jsx
│   │   │   ├── CreateWeeklyUpdate.jsx
│   │   │   └── History.jsx
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Claude API key from Anthropic

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd daily-update
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install

   # Copy and configure environment variables
   cp .env.example .env
   # Edit .env and add your MongoDB URI and Claude API key
   ```

3. **Set up Frontend**
   ```bash
   cd ../frontend
   npm install

   # Copy and configure environment variables
   cp .env.example .env
   # Ensure VITE_API_URL points to your backend (default: http://localhost:5000/api)
   ```

### Configuration

#### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/daily-update-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
ANTHROPIC_API_KEY=your-claude-api-key-here
CLIENT_URL=http://localhost:3000
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

1. **Start MongoDB** (if running locally)
   ```bash
   mongod
   ```

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Backend will run on http://localhost:5000

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on http://localhost:3000

4. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Register a new account
   - Start creating updates!

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Daily Updates
- `POST /api/daily-updates` - Create daily update
- `GET /api/daily-updates` - Get all daily updates (protected)
- `GET /api/daily-updates/:id` - Get single daily update (protected)
- `PUT /api/daily-updates/:id` - Update daily update (protected)
- `DELETE /api/daily-updates/:id` - Delete daily update (protected)

### Weekly Updates
- `POST /api/weekly-updates/generate` - Generate weekly update (protected)
- `POST /api/weekly-updates` - Save weekly update (protected)
- `GET /api/weekly-updates` - Get all weekly updates (protected)
- `GET /api/weekly-updates/:id` - Get single weekly update (protected)
- `PUT /api/weekly-updates/:id` - Update weekly update (protected)
- `DELETE /api/weekly-updates/:id` - Delete weekly update (protected)

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  name: String (required),
  createdAt: Date
}
```

### Updates Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  type: String ("daily" | "weekly"),
  date: Date (for daily updates),
  dateRange: {
    start: Date,
    end: Date
  } (for weekly updates),
  rawInput: String,
  formattedOutput: String,
  sections: {
    todaysProgress: [String],
    ongoingWork: [String],
    nextSteps: [String],
    issues: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Future Enhancements (Phase 2)

- Telegram Bot Integration
- Google Chat Bot Integration
- Auto-collection from team chat spaces
- Multi-client support
- Scheduled reminders
- Analytics and insights

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check MONGODB_URI in backend/.env

2. **Claude API Error**
   - Verify ANTHROPIC_API_KEY is correct
   - Check API key has sufficient credits

3. **CORS Error**
   - Ensure CLIENT_URL in backend/.env matches frontend URL
   - Check backend server is running

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT_SECRET is set in backend/.env

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.

## Support

For issues and questions, please create an issue in the repository.
