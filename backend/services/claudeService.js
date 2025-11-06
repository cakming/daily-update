import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Process technical update text and convert to client-friendly format
 */
export const processDailyUpdate = async (technicalText, date) => {
  try {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const prompt = `You are a technical communication specialist. Transform the following technical team update into a client-friendly daily update.

IMPORTANT FORMATTING REQUIREMENTS:
1. Use this EXACT format:
🗓️ Daily Update — ${formattedDate}

✅ Today's Progress
[Bullet points of completed work]

🔄 Ongoing Work
[Bullet points of in-progress items]

📅 Next Steps (Tomorrow)
[Bullet points of planned work]

⚠️ Issues / Pending Items
[Any blockers or concerns, or "No major issues reported"]

2. Guidelines:
- Convert technical jargon to user-friendly language
- Keep feature names clear (e.g., "Thread Grouping for Reply Emails" is good)
- Translate technical issues to business impact (e.g., "Fixed race condition" → "Resolved timing issues")
- Be concise but informative
- Use bullet points with - for each item
- If there are no issues, write "No major issues reported"
- Maintain professional but friendly tone

Technical Update to Transform:
${technicalText}

Return ONLY the formatted update text, nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const formattedOutput = message.content[0].text.trim();

    // Parse sections from the formatted output
    const sections = parseSections(formattedOutput);

    return {
      formattedOutput,
      sections
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Failed to process update with Claude API: ${error.message}`);
  }
};

/**
 * Generate weekly summary from daily updates
 */
export const processWeeklyUpdate = async (dailyUpdates, startDate, endDate) => {
  try {
    const formattedStartDate = new Date(startDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const formattedEndDate = new Date(endDate).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    // Combine all daily updates
    const combinedUpdates = dailyUpdates.map((update, index) => {
      const date = new Date(update.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      return `--- ${date} ---\n${update.rawInput}`;
    }).join('\n\n');

    const prompt = `You are a technical communication specialist. Create a cohesive weekly summary from the following daily updates.

IMPORTANT FORMATTING REQUIREMENTS:
1. Use this EXACT format:
📊 Weekly Update — ${formattedStartDate} to ${formattedEndDate}

✅ This Week's Achievements
[Summarized completed work from the week]

🔄 Ongoing Initiatives
[Consolidated in-progress items]

📅 Next Week's Focus
[Planned work for upcoming week]

⚠️ Challenges & Action Items
[Any blockers or concerns, or "No major challenges this week"]

2. Guidelines:
- Synthesize related items across days (don't just list daily updates)
- Group similar accomplishments together
- Highlight key achievements and progress
- Show progression and momentum
- Use client-friendly language
- Be strategic and high-level while remaining specific
- Use bullet points with - for each item
- If there were no challenges, write "No major challenges this week"

Daily Updates from this week:
${combinedUpdates}

Return ONLY the formatted weekly update text, nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const formattedOutput = message.content[0].text.trim();

    // Parse sections from the formatted output (adapt field names for weekly)
    const sections = parseWeeklySections(formattedOutput);

    return {
      formattedOutput,
      sections
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Failed to generate weekly update with Claude API: ${error.message}`);
  }
};

/**
 * Parse sections from daily update formatted output
 */
function parseSections(formattedOutput) {
  const sections = {
    todaysProgress: [],
    ongoingWork: [],
    nextSteps: [],
    issues: []
  };

  try {
    const lines = formattedOutput.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Detect section headers
      if (trimmedLine.includes("Today's Progress")) {
        currentSection = 'todaysProgress';
      } else if (trimmedLine.includes('Ongoing Work')) {
        currentSection = 'ongoingWork';
      } else if (trimmedLine.includes('Next Steps')) {
        currentSection = 'nextSteps';
      } else if (trimmedLine.includes('Issues') || trimmedLine.includes('Pending Items')) {
        currentSection = 'issues';
      } else if (trimmedLine.startsWith('- ') && currentSection) {
        // Add bullet point to current section
        sections[currentSection].push(trimmedLine.substring(2));
      } else if (trimmedLine && !trimmedLine.startsWith('🗓️') && !trimmedLine.startsWith('✅') &&
                 !trimmedLine.startsWith('🔄') && !trimmedLine.startsWith('📅') &&
                 !trimmedLine.startsWith('⚠️') && currentSection === 'issues') {
        // For issues section, also capture non-bullet text like "No major issues reported"
        sections[currentSection].push(trimmedLine);
      }
    }
  } catch (error) {
    console.error('Error parsing sections:', error);
  }

  return sections;
}

/**
 * Parse sections from weekly update formatted output
 */
function parseWeeklySections(formattedOutput) {
  const sections = {
    todaysProgress: [], // Will contain "This Week's Achievements"
    ongoingWork: [],    // Will contain "Ongoing Initiatives"
    nextSteps: [],      // Will contain "Next Week's Focus"
    issues: []          // Will contain "Challenges & Action Items"
  };

  try {
    const lines = formattedOutput.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Detect section headers
      if (trimmedLine.includes("Achievements")) {
        currentSection = 'todaysProgress';
      } else if (trimmedLine.includes('Ongoing Initiatives')) {
        currentSection = 'ongoingWork';
      } else if (trimmedLine.includes("Next Week's Focus")) {
        currentSection = 'nextSteps';
      } else if (trimmedLine.includes('Challenges') || trimmedLine.includes('Action Items')) {
        currentSection = 'issues';
      } else if (trimmedLine.startsWith('- ') && currentSection) {
        sections[currentSection].push(trimmedLine.substring(2));
      } else if (trimmedLine && !trimmedLine.startsWith('📊') && !trimmedLine.startsWith('✅') &&
                 !trimmedLine.startsWith('🔄') && !trimmedLine.startsWith('📅') &&
                 !trimmedLine.startsWith('⚠️') && currentSection === 'issues') {
        sections[currentSection].push(trimmedLine);
      }
    }
  } catch (error) {
    console.error('Error parsing weekly sections:', error);
  }

  return sections;
}
