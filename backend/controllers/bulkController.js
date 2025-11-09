import Update from '../models/Update.js';
import Tag from '../models/Tag.js';

/**
 * @desc    Bulk delete updates
 * @route   POST /api/bulk/delete
 * @access  Private
 */
export const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of update IDs'
      });
    }

    // Verify all updates belong to the user
    const updates = await Update.find({
      _id: { $in: ids },
      userId: req.user._id
    });

    if (updates.length !== ids.length) {
      return res.status(403).json({
        success: false,
        message: 'Some updates do not belong to you or do not exist'
      });
    }

    await Update.deleteMany({
      _id: { $in: ids },
      userId: req.user._id
    });

    res.json({
      success: true,
      message: `${ids.length} update(s) deleted successfully`,
      deletedCount: ids.length
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk delete',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk assign tags
 * @route   POST /api/bulk/assign-tags
 * @access  Private
 */
export const bulkAssignTags = async (req, res) => {
  try {
    const { updateIds, tagIds } = req.body;

    if (!updateIds || !Array.isArray(updateIds) || updateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of update IDs'
      });
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of tag IDs'
      });
    }

    // Verify all updates belong to the user
    const updates = await Update.find({
      _id: { $in: updateIds },
      userId: req.user._id
    });

    if (updates.length !== updateIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some updates do not belong to you or do not exist'
      });
    }

    // Verify all tags belong to the user
    const tags = await Tag.find({
      _id: { $in: tagIds },
      userId: req.user._id
    });

    if (tags.length !== tagIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some tags do not belong to you or do not exist'
      });
    }

    // Assign tags to updates (addToSet prevents duplicates)
    await Update.updateMany(
      {
        _id: { $in: updateIds },
        userId: req.user._id
      },
      {
        $addToSet: { tags: { $each: tagIds } }
      }
    );

    // Update tag usage counts
    await Tag.updateMany(
      { _id: { $in: tagIds } },
      { $inc: { usageCount: 1 } }
    );

    res.json({
      success: true,
      message: `Tags assigned to ${updateIds.length} update(s) successfully`,
      updatedCount: updateIds.length
    });
  } catch (error) {
    console.error('Bulk assign tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk tag assignment',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk remove tags
 * @route   POST /api/bulk/remove-tags
 * @access  Private
 */
export const bulkRemoveTags = async (req, res) => {
  try {
    const { updateIds, tagIds } = req.body;

    if (!updateIds || !Array.isArray(updateIds) || updateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of update IDs'
      });
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of tag IDs'
      });
    }

    // Verify all updates belong to the user
    const updates = await Update.find({
      _id: { $in: updateIds },
      userId: req.user._id
    });

    if (updates.length !== updateIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some updates do not belong to you or do not exist'
      });
    }

    // Remove tags from updates
    await Update.updateMany(
      {
        _id: { $in: updateIds },
        userId: req.user._id
      },
      {
        $pull: { tags: { $in: tagIds } }
      }
    );

    res.json({
      success: true,
      message: `Tags removed from ${updateIds.length} update(s) successfully`,
      updatedCount: updateIds.length
    });
  } catch (error) {
    console.error('Bulk remove tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk tag removal',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk assign company
 * @route   POST /api/bulk/assign-company
 * @access  Private
 */
export const bulkAssignCompany = async (req, res) => {
  try {
    const { updateIds, companyId } = req.body;

    if (!updateIds || !Array.isArray(updateIds) || updateIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of update IDs'
      });
    }

    // Verify all updates belong to the user
    const updates = await Update.find({
      _id: { $in: updateIds },
      userId: req.user._id
    });

    if (updates.length !== updateIds.length) {
      return res.status(403).json({
        success: false,
        message: 'Some updates do not belong to you or do not exist'
      });
    }

    // Assign company to updates (null to remove company)
    const updateData = companyId ? { companyId } : { $unset: { companyId: 1 } };

    await Update.updateMany(
      {
        _id: { $in: updateIds },
        userId: req.user._id
      },
      updateData
    );

    res.json({
      success: true,
      message: companyId
        ? `Company assigned to ${updateIds.length} update(s) successfully`
        : `Company removed from ${updateIds.length} update(s) successfully`,
      updatedCount: updateIds.length
    });
  } catch (error) {
    console.error('Bulk assign company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk company assignment',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk export updates
 * @route   POST /api/bulk/export
 * @access  Private
 */
export const bulkExport = async (req, res) => {
  try {
    const { ids, format = 'json' } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of update IDs'
      });
    }

    // Fetch updates
    const updates = await Update.find({
      _id: { $in: ids },
      userId: req.user._id
    })
      .populate('companyId', 'name')
      .populate('tags', 'name color category')
      .sort({ date: -1, 'dateRange.start': -1 });

    if (updates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No updates found'
      });
    }

    // Format data based on requested format
    if (format === 'csv') {
      // Simple CSV format
      const csvRows = ['Type,Date,Company,Content'];
      updates.forEach(update => {
        const type = update.type;
        const date = update.date
          ? new Date(update.date).toISOString().split('T')[0]
          : `${new Date(update.dateRange.start).toISOString().split('T')[0]} to ${new Date(update.dateRange.end).toISOString().split('T')[0]}`;
        const company = update.companyId?.name || 'N/A';
        const content = update.formattedOutput.replace(/"/g, '""').replace(/\n/g, ' ');
        csvRows.push(`"${type}","${date}","${company}","${content}"`);
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=updates.csv');
      res.send(csvRows.join('\n'));
    } else {
      // JSON format (default)
      res.json({
        success: true,
        count: updates.length,
        data: updates
      });
    }
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during bulk export',
      error: error.message
    });
  }
};
