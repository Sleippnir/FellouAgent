import React, from 'react';
import { useAudio } from '../../hooks/useAudio';
import axios from 'axios';

const AudioRecorder: React.FC = () => {
  const [transcript, setTranscript] = React.useState('');
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRecordingComplete = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    setTranscript('');

    const formData = new FormData();
    formData.append('file', blob, 'recording.mp3');

    try {
      const response = await axios.post('/api/audio/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setTranscript(response.data.transcript);
    } catch (err) {
      setError('Failed to transcribe audio. Please try again.');
      console.error(err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const { isRecording, startRecording, stopRecording } = useAudio(handleRecordingComplete);

  return (
    <div>
      <h3>Audio Recorder</h3>
      <button onClick={isRecording ? stopRecording : startRecording} disabled={isTranscribing}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      {isRecording && <p>Recording...</p>}
      {isTranscribing && <p>Transcribing...</p>}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {transcript && (
        <div>
          <h4>Transcript:</h4>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
