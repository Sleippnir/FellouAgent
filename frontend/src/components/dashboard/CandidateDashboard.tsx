import React, { useState } from 'react';
import AudioRecorder from '../interview/AudioRecorder';
import Live2DAvatar from '../avatar/Live2DAvatar';
import { useAvatar } from '../../hooks/useAvatar';

const CandidateDashboard: React.FC = () => {
  const { initialize, speak, isSpeaking, error } = useAvatar();
  const [text, setText] = useState('Hello, I am your AI interviewer. Welcome to the interview.');

  const handleSpeak = () => {
    if (text && !isSpeaking) {
      speak(text);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <div style={{ flex: 1 }}>
        <h2>Candidate Dashboard</h2>
        <p>Welcome to your dashboard.</p>
        <hr />
        <h4>Audio Recording Test</h4>
        <AudioRecorder />
        <hr />
        <h4>Avatar TTS Test</h4>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          style={{ width: '90%', padding: '5px', margin: '10px 0' }}
          placeholder="Enter text for the avatar to speak"
        />
        <br />
        <button onClick={handleSpeak} disabled={isSpeaking}>
          {isSpeaking ? 'Speaking...' : 'Make Avatar Speak'}
        </button>
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>
        <Live2DAvatar initialize={initialize} />
      </div>
    </div>
  );
};

export default CandidateDashboard;
