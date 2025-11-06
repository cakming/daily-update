import Update from '../models/Update.js';
import { format } from 'date-fns';

/**
 * Export updates as CSV
 * @route   GET /api/export/csv
 * @access  Private
 */
export const exportAsCSV = async (req, res) => {
  try {
    const { startDate, endDate, type, companyId } = req.query;

    // Build query
    const query = { userId: req.user._id };
    if (type) query.type = type;
    if (companyId) query.companyId = companyId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const updates = await Update.find(query)
      .populate('companyId', 'name')
      .sort({ date: -1 });

    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No updates found for export'
      });
    }

    // Generate CSV
    const csvHeader = 'Date,Type,Company,Raw Input,Formatted Output\n';
    const csvRows = updates.map(update => {
      const date = update.date ? format(new Date(update.date), 'yyyy-MM-dd') :
                   update.dateRange ? format(new Date(update.dateRange.start), 'yyyy-MM-dd') : '';
      const type = update.type || '';
      const company = update.companyId?.name || 'N/A';
      const rawInput = `"${(update.rawInput || '').replace(/"/g, '""')}"`;
      const formattedOutput = `"${(update.formattedOutput || '').replace(/"/g, '""')}"`;
      return `${date},${type},${company},${rawInput},${formattedOutput}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="daily-updates-${Date.now()}.csv"`);

    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting updates',
      error: error.message
    });
  }
};

/**
 * Export updates as JSON
 * @route   GET /api/export/json
 * @access  Private
 */
export const exportAsJSON = async (req, res) => {
  try {
    const { startDate, endDate, type, companyId } = req.query;

    // Build query
    const query = { userId: req.user._id };
    if (type) query.type = type;
    if (companyId) query.companyId = companyId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const updates = await Update.find(query)
      .populate('companyId', 'name')
      .sort({ date: -1 });

    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No updates found for export'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="daily-updates-${Date.now()}.json"`);

    res.json({
      exportDate: new Date().toISOString(),
      count: updates.length,
      updates: updates.map(update => ({
        date: update.date || update.dateRange,
        type: update.type,
        company: update.companyId?.name || null,
        rawInput: update.rawInput,
        formattedOutput: update.formattedOutput,
        sections: update.sections,
        createdAt: update.createdAt
      }))
    });
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting updates',
      error: error.message
    });
  }
};

/**
 * Export updates as Markdown
 * @route   GET /api/export/markdown
 * @access  Private
 */
export const exportAsMarkdown = async (req, res) => {
  try {
    const { startDate, endDate, type, companyId } = req.query;

    // Build query
    const query = { userId: req.user._id };
    if (type) query.type = type;
    if (companyId) query.companyId = companyId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const updates = await Update.find(query)
      .populate('companyId', 'name')
      .sort({ date: -1 });

    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No updates found for export'
      });
    }

    // Generate Markdown
    let markdown = `# Daily Updates Export\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
    markdown += `**Total Updates:** ${updates.length}\n\n`;
    markdown += `---\n\n`;

    updates.forEach(update => {
      const date = update.date ? format(new Date(update.date), 'MMMM dd, yyyy') :
                   update.dateRange ? `${format(new Date(update.dateRange.start), 'MMM dd')} - ${format(new Date(update.dateRange.end), 'MMM dd, yyyy')}` : '';

      markdown += `## ${date}\n\n`;
      markdown += `**Type:** ${update.type}\n\n`;
      if (update.companyId?.name) {
        markdown += `**Company:** ${update.companyId.name}\n\n`;
      }
      markdown += `${update.formattedOutput}\n\n`;
      markdown += `---\n\n`;
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="daily-updates-${Date.now()}.md"`);

    res.send(markdown);
  } catch (error) {
    console.error('Export Markdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting updates',
      error: error.message
    });
  }
};

/**
 * Get export metadata (count, date range, etc.)
 * @route   GET /api/export/metadata
 * @access  Private
 */
export const getExportMetadata = async (req, res) => {
  try {
    const { type, companyId } = req.query;
    const query = { userId: req.user._id };
    if (type) query.type = type;
    if (companyId) query.companyId = companyId;

    const updates = await Update.find(query).sort({ date: -1 });

    if (updates.length === 0) {
      return res.json({
        success: true,
        data: {
          count: 0,
          dateRange: null,
          types: []
        }
      });
    }

    const dates = updates
      .map(u => u.date || u.dateRange?.start)
      .filter(Boolean)
      .map(d => new Date(d));

    const types = [...new Set(updates.map(u => u.type))];

    res.json({
      success: true,
      data: {
        count: updates.length,
        dateRange: {
          start: new Date(Math.min(...dates)),
          end: new Date(Math.max(...dates))
        },
        types,
        estimatedSizes: {
          csv: `${Math.ceil(JSON.stringify(updates).length / 1024)}KB`,
          json: `${Math.ceil(JSON.stringify(updates).length / 1024)}KB`,
          markdown: `${Math.ceil(JSON.stringify(updates).length / 512)}KB`
        }
      }
    });
  } catch (error) {
    console.error('Export metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting export metadata',
      error: error.message
    });
  }
};
