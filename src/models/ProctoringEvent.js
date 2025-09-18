import mongoose from 'mongoose';

const proctoringEventSchema = new mongoose.Schema({
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
      'Camera access denied'
    ]
  },
  details: {
    type: String,
    default: ''
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for efficient querying by sessionId and timestamp
proctoringEventSchema.index({ sessionId: 1, timestamp: 1 });

const ProctoringEvent = mongoose.model('ProctoringEvent', proctoringEventSchema);

export default ProctoringEvent;