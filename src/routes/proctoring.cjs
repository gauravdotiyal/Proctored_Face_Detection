const express = require('express');
const router = express.Router();
const ProctoringEvent = require('../models/ProctoringEvent.cjs');

router.post('/events', async (req, res) => {
  try {
    const { type, details, sessionId } = req.body;
    const event = new ProctoringEvent({ type, details, sessionId });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: 'Failed to log event', details: error.message });
  }
});

router.get('/reports/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const allEvents = await ProctoringEvent.find({ sessionId })
      .sort({ timestamp: -1 })
      .lean();

    const focusEvents = allEvents.filter(event =>
      ['No face detected', 'Multiple faces detected', 'Not looking at screen'].includes(event.type)
    );

    const itemEvents = allEvents.filter(event =>
      ['Suspicious items detected'].includes(event.type)
    );

    const drowsinessEvents = allEvents.filter(event =>
      ['Drowsiness detected'].includes(event.type)
    );

    const audioEvents = allEvents.filter(event =>
      ['Background noise detected'].includes(event.type)
    );

    res.json({
      allEvents,
      focusEvents,
      itemEvents,
      drowsinessEvents,
      audioEvents
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report', details: error.message });
  }
});

router.get('/reports', async (req, res) => {
  try {
    const sessions = await ProctoringEvent.aggregate([
      {
        $group: {
          _id: '$sessionId',
          startTime: { $min: '$timestamp' },
          endTime: { $max: '$timestamp' },
          focusIssues: {
            $sum: {
              $cond: [
                { $in: ['$type', ['No face detected', 'Multiple faces detected', 'Not looking at screen']] },
                1,
                0
              ]
            }
          },
          suspiciousItems: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Suspicious items detected'] }, 1, 0]
            }
          },
          drowsinessIssues: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Drowsiness detected'] }, 1, 0]
            }
          },
          audioIssues: {
            $sum: {
              $cond: [{ $eq: ['$type', 'Background noise detected'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          sessionId: '$_id',
          duration: {
            $divide: [{ $subtract: ['$endTime', '$startTime'] }, 60000]
          },
          focusIssues: 1,
          suspiciousItems: 1,
          drowsinessIssues: 1,
          audioIssues: 1,
          integrityScore: {
            $subtract: [
              100,
              {
                $add: [
                  { $multiply: ['$focusIssues', 5] },
                  { $multiply: ['$suspiciousItems', 10] },
                  { $multiply: ['$drowsinessIssues', 8] },
                  { $multiply: ['$audioIssues', 5] }
                ]
              }
            ]
          }
        }
      },
      { $sort: { startTime: -1 } }
    ]);

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions summary', details: error.message });
  }
});

// Get focus related events for a specific session
router.get('/reports/focus/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const focusEvents = await ProctoringEvent.find({
      sessionId,
      type: { $in: ['No face detected', 'Multiple faces detected', 'Not looking at screen'] }
    })
      .sort({ timestamp: -1 })
      .lean();

    res.json({ focusEvents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch focus events', details: error.message });
  }
});

// Get suspicious item detection events for a specific session
router.get('/reports/items/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const itemEvents = await ProctoringEvent.find({
      sessionId,
      type: { $in: ['Suspicious items detected'] }
    })
      .sort({ timestamp: -1 })
      .lean();

    res.json({ itemEvents });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch item events', details: error.message });
  }
});
module.exports = router;