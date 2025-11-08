# Daily Update App - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Updates](#creating-updates)
3. [Managing Companies](#managing-companies)
4. [Using Templates](#using-templates)
5. [Tags & Categories](#tags--categories)
6. [Analytics & Insights](#analytics--insights)
7. [Email Delivery](#email-delivery)
8. [Scheduled Updates](#scheduled-updates)
9. [Integrations](#integrations)
10. [Notifications](#notifications)
11. [Search & History](#search--history)
12. [Security Settings](#security-settings)

---

## Getting Started

### Creating Your Account

1. Navigate to the Daily Update App
2. Click "Sign Up" or "Register"
3. Enter your name, email, and password
4. Verify your email address (check your inbox)
5. Log in with your credentials

### Dashboard Overview

The dashboard is your central hub with quick access to:
- Create Daily Update
- Generate Weekly Summary
- View History
- Advanced Search
- Manage Companies
- Update Templates
- Tags & Categories
- Notifications
- View Analytics
- Email Settings
- Scheduled Updates
- Integrations
- Profile Settings

---

## Creating Updates

### Daily Updates

**Purpose**: Track your daily progress and accomplishments

**How to Create**:
1. Click "Create Daily Update" from the dashboard
2. Select a company (optional)
3. Select a template (optional) or start fresh
4. Write your update content
5. Add tags to categorize (optional)
6. Click "Generate Update"
7. AI will summarize and format your update
8. Review and save

**Best Practices**:
- Be concise but specific
- Include key metrics or achievements
- Mention blockers or challenges
- Update daily for best results

### Weekly Summaries

**Purpose**: Aggregate daily updates into a comprehensive weekly report

**How to Create**:
1. Click "Generate Weekly Summary"
2. Select date range (defaults to last 7 days)
3. Select company filter (optional)
4. AI automatically aggregates your daily updates
5. Review the generated summary
6. Edit if needed
7. Save your weekly summary

**Features**:
- Auto-aggregation of daily updates
- AI-powered summarization
- Company filtering
- Period selection
- Export capabilities

---

## Managing Companies

### Adding Companies

1. Go to "Manage Companies"
2. Click "Add Company"
3. Enter company name
4. Select a color for visual identification
5. Add description (optional)
6. Save

### Organizing Updates by Company

- Select company when creating updates
- Filter history by company
- View company-specific analytics
- Export company updates

### Editing/Deleting Companies

- Click the company card
- Select "Edit" or "Delete"
- Confirm changes

**Note**: Deleting a company doesn't delete associated updates

---

## Using Templates

### What are Templates?

Templates are reusable update formats that save you time and ensure consistency.

### Creating Templates

1. Navigate to "Update Templates"
2. Click "Create Template"
3. Enter template name
4. Write template content with placeholders
5. Add tags (optional)
6. Save

**Example Template**:
```
Today I worked on:
- [Task 1]
- [Task 2]

Completed:
- [Achievement 1]

Blockers:
- [Challenge]

Tomorrow:
- [Plan]
```

### Using Templates

1. When creating an update, click "Use Template"
2. Select your template
3. Fill in the placeholders
4. Generate update

---

## Tags & Categories

### Creating Tags

1. Go to "Tags & Categories"
2. Click "Create Tag"
3. Enter tag name
4. Select color
5. Add description (optional)
6. Save

### Using Tags

- Add tags when creating updates
- Use multiple tags per update
- Filter history by tags
- View tag-based analytics

### Common Tag Categories

- **Type**: Feature, Bug Fix, Meeting, Planning
- **Priority**: High, Medium, Low
- **Status**: In Progress, Completed, Blocked
- **Project**: Project names or codes

---

## Analytics & Insights

### Dashboard Analytics

Access from "View Analytics" to see:

**Activity Trends**:
- Line chart showing daily/weekly activity
- Identify productivity patterns
- Track consistency

**Cumulative Updates**:
- Area chart of cumulative progress
- Visualize growth over time

**Company Distribution**:
- Bar chart of updates by company
- Balance workload visibility

**Update Distribution**:
- Pie chart showing daily vs weekly updates

### Filtering Analytics

- Date range selection
- Company filtering
- Update type filtering
- Tag-based filtering

---

## Email Delivery

### Email Configuration

**Admin Setup** (one-time):
1. Go to "Email Settings"
2. Check configuration status
3. Admin must configure SMTP settings:
   - EMAIL_HOST
   - EMAIL_PORT
   - EMAIL_USER
   - EMAIL_PASS
   - EMAIL_FROM
   - EMAIL_FROM_NAME

### Sending Updates via Email

**From History Page**:
1. Go to "View History"
2. Find the update to send
3. Click "Email" button
4. Enter recipient email addresses
5. Add multiple recipients (comma-separated)
6. Click "Send Email"

**Email Features**:
- Professional HTML formatting
- Company branding
- AI summaries included
- Tags displayed
- Mobile-friendly
- Plain text fallback

### Test Email

1. Go to "Email Settings"
2. Enter your email
3. Click "Send Test"
4. Check your inbox
5. Verify formatting

---

## Scheduled Updates

### Creating Schedules

1. Go to "Scheduled Updates"
2. Click "Create Schedule"
3. Select update type (Daily/Weekly)
4. Choose company (optional)
5. Add tags (optional)
6. Enter content template
7. Select schedule type:
   - **One-time**: Specific date and time
   - **Daily**: Every day at specific time
   - **Weekly**: Specific day of week
   - **Monthly**: Specific day of month
8. Set time (24-hour format)
9. Optional: Enable email delivery
10. Add email recipients
11. Save schedule

### Managing Schedules

**Activate/Deactivate**:
- Toggle switch on schedule card
- Inactive schedules won't run

**Edit Schedule**:
- Click "Edit" on schedule card
- Modify settings
- Save changes

**View Next Run**:
- Displayed on schedule card
- Updated automatically

**Delete Schedule**:
- Click "Delete"
- Confirm deletion
- History is preserved

### Schedule History

View execution history:
1. Go to schedule details
2. View "History" tab
3. See:
   - Execution timestamps
   - Success/failure status
   - Created update links
   - Execution time
   - Error messages (if failed)
   - Email delivery status

---

## Integrations

### Telegram Bot

**Setup**:
1. Search for `@DailyUpdateBot` on Telegram
2. Start a chat with `/start`
3. Use `/link` command
4. Copy your Telegram ID
5. Go to "Integrations" in app
6. Enter Telegram ID
7. Click "Connect"
8. Receive confirmation in Telegram

**Available Commands**:
- `/today` - Get today's updates
- `/week` - Get this week's summary
- `/stats` - View your statistics
- `/latest` - Get your latest update
- `/help` - Show all commands

**Features**:
- Real-time update notifications
- Query your updates via bot
- Statistics on demand
- Mobile-friendly

### Google Chat

**Setup**:
1. Open your Google Chat space
2. Click space name → Apps & integrations → Webhooks
3. Create incoming webhook
4. Copy webhook URL
5. Go to "Integrations" in app
6. Paste webhook URL
7. Click "Connect"

**Features**:
- Rich card formatting
- Update notifications to space
- Daily/weekly summaries
- Team collaboration

**Test Integration**:
- Click "Send Test Message"
- Check your chat space
- Verify formatting

---

## Notifications

### Notification Types

**In-App Notifications**:
- System notifications (bell icon)
- Update reminders
- Achievement notifications
- Dropdown panel with recent notifications

### Notification Preferences

Access from Profile → Integrations or Notification icon:

**Email Notifications**:
- Daily digest
- Weekly digest
- System alerts
- Update reminders

**In-App Notifications**:
- System notifications
- Update notifications
- Reminder notifications
- Achievement notifications

**Bot Notifications**:
- Telegram notifications
- Google Chat notifications
- Send on update create
- Daily summary
- Weekly summary

**Quiet Hours**:
- Enable/disable
- Set start time
- Set end time
- Select timezone

### Managing Notifications

**Mark as Read**:
- Click notification to mark as read
- Or click "Mark all as read"

**Delete Notifications**:
- Click X on individual notification
- Or "Clear read notifications"

**Filter Notifications**:
- All/Unread/Read
- By category

---

## Search & History

### Advanced Search

Access from Dashboard → "Advanced Search":

**Search Options**:
- Free text search (searches content and summaries)
- Update type (Daily/Weekly/All)
- Company filter
- Tag filter
- Date range (from/to)
- Sort by (Newest/Oldest/Company)

**Using Search**:
1. Enter search term
2. Apply filters
3. Click "Search"
4. View results
5. Click result to navigate

**Clear Filters**:
- Click "Clear Filters" to reset

### History Page

**Viewing History**:
1. Go to "View History"
2. Browse tabs:
   - Daily Updates
   - Weekly Summaries

**Filtering History**:
- Search by text
- Filter by company
- Filter by tags
- Date range selection

**Actions on Updates**:
- **Copy**: Copy to clipboard
- **Email**: Send via email
- **Edit**: Modify and regenerate
- **Delete**: Remove update

### Bulk Operations

Select multiple updates:
- **Bulk Delete**: Remove multiple updates
- **Assign Tags**: Add tags to multiple updates
- **Remove Tags**: Remove tags from selected
- **Export**: Download selected updates

---

## Security Settings

### Two-Factor Authentication (2FA)

**Enable 2FA**:
1. Go to Profile → Security Settings
2. Click "Manage Two-Factor Authentication"
3. Click "Enable 2FA"
4. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
5. Or manually enter the secret key
6. Enter 6-digit code to verify
7. **IMPORTANT**: Save backup codes securely
8. Store backup codes in password manager

**Login with 2FA**:
1. Enter email and password
2. Enter 6-digit code from authenticator app
3. Or use backup code if needed

**Disable 2FA**:
1. Go to 2FA Settings
2. Enter password
3. Enter 2FA code
4. Click "Disable 2FA"

**Backup Codes**:
- Save immediately after enabling 2FA
- Each code can only be used once
- Generate new codes if running low
- Store securely offline

### Password Management

**Change Password**:
1. Go to Profile
2. Scroll to "Change Password"
3. Enter current password
4. Enter new password (min 6 characters)
5. Confirm new password
6. Click "Update Password"

**Password Requirements**:
- Minimum 6 characters
- Recommend: Mix of letters, numbers, symbols
- Don't reuse passwords from other sites

### Account Security Best Practices

1. ✅ Enable Two-Factor Authentication
2. ✅ Use strong, unique password
3. ✅ Regularly update password
4. ✅ Keep backup codes secure
5. ✅ Verify email address
6. ✅ Review notification settings
7. ✅ Monitor login activity
8. ✅ Use password manager

---

## Tips & Best Practices

### Daily Updates
- Write updates daily for consistency
- Be specific about accomplishments
- Include metrics when possible
- Note blockers early
- Review before saving

### Weekly Summaries
- Generate on Fridays or Mondays
- Review before sharing
- Highlight key achievements
- Summarize challenges
- Plan for next week

### Organization
- Create companies for each client/project
- Use consistent tags
- Organize templates by type
- Archive old companies
- Regular cleanup

### Integrations
- Test integrations after setup
- Configure notification preferences
- Use quiet hours effectively
- Leverage bot commands
- Share with team via Google Chat

### Scheduling
- Use templates for consistent scheduled updates
- Test schedule before activating
- Monitor schedule history
- Adjust timing as needed
- Use email delivery for reports

---

## Troubleshooting

### Can't Log In
- Verify email address
- Check password (case-sensitive)
- Reset password if forgotten
- Check for verification email
- Contact support

### 2FA Issues
- Check authenticator app time sync
- Use backup code
- Re-scan QR code if needed
- Contact support to disable 2FA

### Email Not Sending
- Check email configuration status
- Verify recipient addresses
- Test with "Send Test Email"
- Contact admin for SMTP setup

### Schedule Not Running
- Check schedule is active (toggle on)
- Verify next run time
- Check schedule history for errors
- Ensure correct timezone
- Review quiet hours settings

### Integration Not Working
- Telegram: Verify Telegram ID correct
- Google Chat: Check webhook URL
- Send test message
- Re-link if needed
- Check notification preferences

---

## Support & Resources

### Getting Help
- Check this user guide
- Review API documentation
- Check deployment guide
- Email: support@dailyupdate.com
- GitHub Issues: [Repository URL]

### Feedback
We welcome your feedback!
- Feature requests
- Bug reports
- Usability improvements
- Documentation updates

### Updates & Changelog
- Check release notes
- Review new features
- Update your app regularly
- Follow best practices

---

**Version**: 1.0.0  
**Last Updated**: 2025-11-08  
**© 2025 Daily Update App**
