import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model is configurable via the ANTHROPIC_MODEL env var (see .env examples);
// defaults to the current Sonnet tier. `thinking: disabled` keeps output direct
// (Sonnet 5 runs adaptive thinking by default, which would otherwise consume
// the max_tokens budget).
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

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

Return the formatted update text. Then, on a final separate line, write the
marker @@SUMMARY@@ followed by a single plain-text sentence (max 25 words)
summarizing the update for a one-line preview.`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3000,
      thinking: { type: 'disabled' },
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Split the model's one-line summary off the formatted body.
    const { formattedOutput, aiSummary: modelSummary } = splitSummary(
      message.content[0].text
    );

    // Parse sections from the formatted output
    const sections = parseSections(formattedOutput);

    return {
      formattedOutput,
      sections,
      aiSummary: modelSummary || deriveSummary(formattedOutput, sections),
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

Return the formatted weekly update text. Then, on a final separate line, write
the marker @@SUMMARY@@ followed by a single plain-text sentence (max 25 words)
summarizing the week for a one-line preview.`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 3500,
      thinking: { type: 'disabled' },
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Split the model's one-line summary off the formatted body.
    const { formattedOutput, aiSummary: modelSummary } = splitSummary(
      message.content[0].text
    );

    // Parse sections from the formatted output (adapt field names for weekly)
    const sections = parseWeeklySections(formattedOutput);

    return {
      formattedOutput,
      sections,
      aiSummary: modelSummary || deriveSummary(formattedOutput, sections),
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Failed to generate weekly update with Claude API: ${error.message}`);
  }
};

/**
 * Split a model response into the formatted body and the one-line summary the
 * prompt asks for after an @@SUMMARY@@ marker. If the marker is absent (older
 * prompts, model variance) the whole response is the body and the summary is
 * empty, letting callers fall back to deriveSummary().
 */
export const splitSummary = (raw = '') => {
  const parts = String(raw).split(/@@SUMMARY@@/i);
  const formattedOutput = parts[0].trim();
  const aiSummary = (parts[1] || '').trim().replace(/^[:\-\s]+/, '');
  return { formattedOutput, aiSummary };
};

/**
 * Derive a short, one-glance summary from an AI-formatted update. Prefers the
 * first highlights of the progress/achievements section, falling back to the
 * first bullet lines of the formatted output. No extra API call — this is a
 * concise view of content the model already produced. Used for the "summary"
 * notification mode (vs the full formatted output).
 */
export const deriveSummary = (formattedOutput = '', sections = {}) => {
  const highlights =
    (sections?.todaysProgress?.length && sections.todaysProgress) ||
    (sections?.ongoingWork?.length && sections.ongoingWork) ||
    [];

  if (highlights.length > 0) {
    return highlights.slice(0, 2).join(' ').trim().slice(0, 280);
  }

  const bullets = formattedOutput
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'))
    .map((line) => line.replace(/^-\s*/, ''));

  if (bullets.length > 0) {
    return bullets.slice(0, 2).join(' ').slice(0, 280);
  }

  // Last resort: first non-empty line after the header.
  const lines = formattedOutput.split('\n').map((l) => l.trim()).filter(Boolean);
  return (lines[1] || lines[0] || '').slice(0, 280);
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
