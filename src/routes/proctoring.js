import express from 'express';
import ProctoringEvent from '../models/ProctoringEvent.js';

const router = express.Router();

// Log new proctoring event
router.post('/events', async (req, res) => {
  try {
    const { type, details, sessionId } = req.body;
    const event = new ProctoringEvent({
      type,
      details,
      sessionId,
      timestamp: new Date()
    });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    console.error('Error logging event:', error);
    res.status(500).json({ error: 'Failed to log event', details: error.message });
  }
});

// Get detailed session report
router.get('/reports/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const events = await ProctoringEvent.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    const report = {
      sessionId,
      totalEvents: events.length,
      focusEvents: events.filter(e => 
        ['No face detected', 'Multiple faces detected', 'Not looking at screen'].includes(e.type)
      ),
      itemEvents: events.filter(e =>
        ['Suspicious items detected', 'Items removed'].includes(e.type)
      ),
      recordingEvents: events.filter(e =>
        ['Recording started', 'Recording stopped', 'Recording downloaded'].includes(e.type)
      ),
      cameraEvents: events.filter(e =>
        ['Camera enabled', 'Camera disabled', 'Camera access denied'].includes(e.type)
      ),
      summary: {
        focusViolations: events.filter(e => 
          ['No face detected', 'Multiple faces detected', 'Not looking at screen'].includes(e.type)
        ).length,
        itemViolations: events.filter(e =>
          ['Suspicious items detected'].includes(e.type)
        ).length,
        cameraIssues: events.filter(e =>
          ['Camera access denied'].includes(e.type)
        ).length
      },
      allEvents: events
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

// Get all sessions summary with aggregation pipeline
router.get('/reports', async (req, res) => {
  try {
    const reports = await ProctoringEvent.aggregate([
      {
        $group: {
          _id: '$sessionId',
          totalEvents: { $sum: 1 },
          startTime: { $min: '$timestamp' },
          endTime: { $max: '$timestamp' },
          focusViolations: {
            $sum: {
              $cond: [
                { $in: ['$type', ['No face detected', 'Multiple faces detected', 'Not looking at screen']] },
                1,
                0
              ]
            }
          },
          itemViolations: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'Suspicious items detected'] },
                1,
                0
              ]
            }
          },
          cameraIssues: {
            $sum: {
              $cond: [
                { $eq: ['$type', 'Camera access denied'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          sessionId: '$_id',
          totalEvents: 1,
          duration: { $subtract: ['$endTime', '$startTime'] },
          startTime: 1,
          endTime: 1,
          focusViolations: 1,
          itemViolations: 1,
          cameraIssues: 1
        }
      },
      { $sort: { startTime: -1 } }
    ]);

    res.json(reports);
  } catch (error) {
    console.error('Error generating sessions summary:', error);
    res.status(500).json({ error: 'Failed to generate sessions summary', details: error.message });
  }
});

export default router;