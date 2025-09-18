const mongoose = require('mongoose');

const proctoringEventSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'No face detected',
      'Multiple faces detected',
      'Not looking at screen',
      'Suspicious items detected',
      'Items removed',
      'Recording started',
      'Recording stopped',
      'Recording downloaded',
      'Camera enabled',
      'Camera disabled',
      'Camera access denied',
      'Drowsiness detected',
      'Background noise detected'
    ]
  },
  details: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create a compound index on sessionId and timestamp
proctoringEventSchema.index({ sessionId: 1, timestamp: -1 });

const ProctoringEvent = mongoose.model('ProctoringEvent', proctoringEventSchema);

module.exports = ProctoringEvent;