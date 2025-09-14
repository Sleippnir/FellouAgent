import { useState, useRef } from 'react';
import MicRecorder from 'mic-recorder-to-mp3';

// The MicRecorder library might not have TypeScript definitions,
// so we might need to use 'any' or declare a simple interface.
// For now, we'll assume it works with 'any' if types are missing.

export const useAudio = (onRecordingComplete: (blob: Blob) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Use a ref to hold the recorder instance
  const recorder = useRef<any>(null);

  const startRecording = async () => {
    // Initialize the recorder if it doesn't exist
    if (!recorder.current) {
      recorder.current = new MicRecorder({ bitRate: 128 });
    }

    try {
      await recorder.current.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Error starting recording:', e);
    }
  };

  const stopRecording = async () => {
    if (!recorder.current) return;

    try {
      const [buffer, blob] = await recorder.current.stop().getMp3();
      setAudioBlob(blob);
      setIsRecording(false);
      if (onRecordingComplete) {
        onRecordingComplete(blob);
      }
    } catch (e) {
      console.error('Error stopping recording:', e);
    }
  };

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
  };
};
