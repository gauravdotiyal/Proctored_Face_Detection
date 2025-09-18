# AI-Powered Video Proctoring System

A sophisticated video proctoring system built with React and Node.js that uses artificial intelligence to ensure exam integrity through real-time monitoring and analysis.

## Features

### Core Features
- **Face Detection & Tracking**
  - Real-time face presence monitoring
  - Multiple face detection alerts
  - Face position and orientation tracking
  - Eye closure/drowsiness detection

- **Object Detection**
  - Identifies unauthorized items (phones, books, etc.)
  - Real-time alerts for suspicious objects
  - Continuous monitoring and logging

- **Focus Monitoring**
  - Tracks candidate's attention
  - Alerts for extended periods of distraction
  - Screen focus analysis

- **Audio Monitoring**
  - Background voice detection
  - Ambient noise analysis
  - Audio anomaly alerts

- **Session Recording**
  - Video capture and storage
  - Downloadable session recordings
  - Event timeline with timestamps

- **Real-time Alerts**
  - Instant notifications for violations
  - Alert dashboard for proctors
  - Severity-based alert categorization

- **Comprehensive Reporting**
  - Detailed session analytics
  - Integrity score calculation
  - Event logs and summaries

## Technology Stack

### Frontend
- React.js
- TensorFlow.js
- MediaPipe
- Styled Components
- WebRTC

### Backend
- Node.js
- Express.js
- MongoDB
- Socket.IO

## Project Structure

```
├── src/
│   ├── components/
│   │   └── VideoProctoring.jsx    # Main proctoring component
│   ├── config/
│   │   └── database.js            # Database configuration
│   ├── models/
│   │   └── ProctoringEvent.js     # Event data model
│   ├── routes/
│   │   └── proctoring.js          # API routes
│   └── server.js                   # Express server setup
```

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd video-proctoring-system
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/ProctoredDemo
   PORT=5000
   ```

4. **Start Development Servers**
   ```bash
   # Start frontend development server
   npm run dev

   # Start backend server
   npm run dev:backend
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## API Endpoints

### Proctoring Events
- `POST /api/proctoring/events`
  - Log proctoring events

### Reports
- `GET /api/proctoring/reports/:sessionId`
  - Get detailed session report
- `GET /api/proctoring/reports`
  - Get summary of all sessions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
