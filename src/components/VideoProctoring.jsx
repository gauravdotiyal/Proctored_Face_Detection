import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import * as cocossd from '@tensorflow-models/coco-ssd';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:5000/api/proctoring';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
`;

const VideoContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const AlertContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: ${props => props['data-alert'] === 'true' ? '#ff4444' : '#44ff44'};
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  opacity: 0.9;
`;

const EventLog = styled.div`
  width: 100%;
  max-width: 600px;
  height: 200px;
  overflow-y: auto;
  border: 1px solid #ccc;
  padding: 10px;
  margin-top: 20px;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background-color: ${props => props['data-recording'] === 'true' ? '#ff4444' : '#4444ff'};
  color: white;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

const ItemList = styled.div`
  margin-top: 10px;
  padding: 8px;
  background-color: #fff4f4;
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const ItemTag = styled.span`
  background-color: #ff4444;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
`;

const VideoProctoring = () => {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [faceModel, setFaceModel] = useState(null);
  const [objectModel, setObjectModel] = useState(null);
  const [events, setEvents] = useState([]);
  const [isFocused, setIsFocused] = useState(true);
  const [lastFaceDetectionTime, setLastFaceDetectionTime] = useState(Date.now());
  const [lastFocusedTime, setLastFocusedTime] = useState(Date.now());
  const [suspiciousItems, setSuspiciousItems] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [lastDetectedItems, setLastDetectedItems] = useState(new Set());
  const [sessionId] = useState(uuidv4());

  useEffect(() => {
    const loadModels = async () => {
      await tf.ready();
      const loadedFaceModel = await blazeface.load();
      const loadedObjectModel = await cocossd.load();
      setFaceModel(loadedFaceModel);
      setObjectModel(loadedObjectModel);
    };
    loadModels();
  }, []);

  const logEvent = async (type, details = '') => {
    const newEvent = {
      type,
      details,
      sessionId,
      timestamp: new Date().toLocaleTimeString()
    };

    // Update local state
    setEvents(prev => [newEvent, ...prev]);

    // Send to backend
    try {
      await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          details,
          sessionId
        })
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  };

  const detectFace = async () => {
    if (webcamRef.current && faceModel) {
      const video = webcamRef.current.video;
      const predictions = await faceModel.estimateFaces(video, false);

      if (predictions.length === 0) {
        const timeSinceLastFace = Date.now() - lastFaceDetectionTime;
        if (timeSinceLastFace > 10000) { // 10 seconds
          logEvent('No face detected', 'No face detected for more than 10 seconds');
          setIsFocused(false);
        }
      } else if (predictions.length > 1) {
        logEvent('Multiple faces detected', `${predictions.length} faces detected`);
        setIsFocused(false);
      } else {
        const face = predictions[0];
        const [x, y] = face.landmarks[2]; // Nose position
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        const isFacingScreen = 
          x > videoWidth * 0.25 && x < videoWidth * 0.75 &&
          y > videoHeight * 0.25 && y < videoHeight * 0.75;

        if (!isFacingScreen) {
          const timeSinceLastFocus = Date.now() - lastFocusedTime;
          if (timeSinceLastFocus > 5000) { // 5 seconds
            logEvent('Not looking at screen', 'Not looking at screen for more than 5 seconds');
            setIsFocused(false);
          }
        } else {
          setLastFocusedTime(Date.now());
          setLastFaceDetectionTime(Date.now());
          setIsFocused(true);
        }
      }
    }
  };

  const detectObjects = async () => {
    if (webcamRef.current && objectModel) {
      const video = webcamRef.current.video;
      const predictions = await objectModel.detect(video);

      const suspiciousClasses = new Map([
        ['cell phone', 'Mobile Phone'],
        ['mobile phone', 'Mobile Phone'],
        ['book', 'Book/Notes'],
        ['laptop', 'Laptop'],
        ['tablet', 'Tablet'],
        ['computer', 'Computer'],
        ['monitor', 'Extra Screen'],
        ['keyboard', 'External Keyboard'],
        ['mouse', 'External Mouse'],
        ['remote', 'Remote Control'],
        ['paper', 'Paper Notes'],
        ['notebook', 'Notebook']
      ]);

      const detectedItems = new Set();
      predictions.forEach(pred => {
        const normalizedClass = pred.class.toLowerCase();
        if (suspiciousClasses.has(normalizedClass)) {
          detectedItems.add(suspiciousClasses.get(normalizedClass));
        }
      });

      // Only log new items or when previously detected items disappear
      const newItems = [...detectedItems].filter(item => !lastDetectedItems.has(item));
      const removedItems = [...lastDetectedItems].filter(item => !detectedItems.has(item));

      if (newItems.length > 0) {
        logEvent('Suspicious items detected', `New items detected: ${newItems.join(', ')}`);
      }
      if (removedItems.length > 0) {
        logEvent('Items removed', `Items no longer visible: ${removedItems.join(', ')}`);
      }

      setSuspiciousItems([...detectedItems]);
      setLastDetectedItems(detectedItems);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      detectFace();
      detectObjects();
    }, 1000);

    return () => clearInterval(interval);
  }, [faceModel, objectModel]);

  const handleStartRecording = () => {
    setRecordedChunks([]);
    if (webcamRef.current && webcamRef.current.stream) {
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      logEvent('Recording started');
    }
  };

  const handleDataAvailable = ({ data }) => {
    if (data && data.size > 0) {
      setRecordedChunks((prev) => [...prev, data]);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.removeEventListener('dataavailable', handleDataAvailable);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      logEvent('Recording stopped');
    }
  };

  const handleDownload = () => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: 'video/webm'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style = 'display: none';
      a.href = url;
      a.download = `interview-recording-${sessionId}-${new Date().toISOString()}.webm`;
      a.click();
      window.URL.revokeObjectURL(url);
      setRecordedChunks([]);
      logEvent('Recording downloaded');
    }
  };

  return (
    <Container>
      <VideoContainer>
        <Webcam
          ref={webcamRef}
          audio={true}
          width={640}
          height={480}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: 'user'
          }}
        />
        <AlertContainer data-alert={(!isFocused || suspiciousItems.length > 0).toString()}>
          {!isFocused ? 'Focus Lost!' : suspiciousItems.length > 0 ? 'Suspicious Items Detected!' : 'All Clear'}
        </AlertContainer>
      </VideoContainer>

      {suspiciousItems.length > 0 && (
        <ItemList>
          {suspiciousItems.map((item, index) => (
            <ItemTag key={index}>{item}</ItemTag>
          ))}
        </ItemList>
      )}

      <Controls>
        {!isRecording ? (
          <Button onClick={handleStartRecording}>Start Recording</Button>
        ) : (
          <Button data-recording="true" onClick={handleStopRecording}>Stop Recording</Button>
        )}
        {recordedChunks.length > 0 && (
          <Button onClick={handleDownload}>Download Recording</Button>
        )}
      </Controls>

      <EventLog>
        {events.map((event, index) => (
          <div key={index}>
            [{event.timestamp}] {event.type}
            {event.details && `: ${event.details}`}
          </div>
        ))}
      </EventLog>
    </Container>
  );
};

export default VideoProctoring;