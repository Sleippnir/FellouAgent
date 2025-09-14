import React from 'react';
import AudioRecorder from '../interview/AudioRecorder';

const CandidateDashboard: React.FC = () => {
  return (
    <div>
      <h2>Candidate Dashboard</h2>
      <p>Welcome to your dashboard.</p>
      <hr />
      <AudioRecorder />
    </div>
  );
};

export default CandidateDashboard;
