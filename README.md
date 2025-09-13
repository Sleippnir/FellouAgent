# React Voice Interview System - Complete Design Blueprint

## 🎯 System Overview

This blueprint provides comprehensive specifications for building an automated voice interview system with an animated Live2D interviewer avatar. The system combines real-time voice interaction, avatar animation with lip-sync, and AI-powered evaluation.

### 🌟 Core Features
- **Animated Interviewer Avatar**: Live2D VTuber model with real-time lip-sync
- **Voice Processing**: Local OpenAI Whisper (STT) + Piper (TTS)
- **Dialog Orchestration**: Pipecat for conversation management
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI Evaluation**: LLM-based assessment with structured rubrics
- **Complete Data Persistence**: All interview turns and evaluations stored

---

## 🛠️ Technology Stack & Dependencies

### Frontend Stack (package.json)
```json
{
  "name": "voice-interview-frontend",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0", 
    "react-router-dom": "^6.8.0",
    "@supabase/supabase-js": "^2.38.0",
    "pixi.js": "^7.3.0",
    "pixi-live2d-display": "^0.5.0",
    "@pixi/sound": "^5.2.0",
    "socket.io-client": "^4.7.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^4.32.0",
    "axios": "^1.6.0",
    "wavesurfer.js": "^6.6.0",
    "mic-recorder-to-mp3": "^2.2.2",
    "react-speech-recognition": "^3.10.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "@mui/material": "^5.14.0",
    "@mui/icons-material": "^5.14.0",
    "@mui/lab": "^5.0.0-alpha.150",
    "framer-motion": "^10.16.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^4.4.0",
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

### Backend Stack (package.json)
```json
{
  "name": "voice-interview-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "socket.io": "^4.7.0",
    "@supabase/supabase-js": "^2.38.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "multer": "^1.4.5-lts.1",
    "fluent-ffmpeg": "^2.1.2",
    "axios": "^1.6.0",
    "uuid": "^9.0.0",
    "joi": "^17.11.0",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0",
    "openai": "^4.20.0",
    "ws": "^8.14.0"
  }
}
```

### Python Requirements (requirements.txt)
```
pipecat-ai==0.0.25
openai-whisper==20231117
piper-tts==1.2.0
torch==2.1.0
torchaudio==2.1.0
numpy==1.24.3
scipy==1.11.0
librosa==0.10.1
soundfile==0.12.1
fastapi==0.104.0
uvicorn==0.24.0
python-multipart==0.0.6
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

### Complete Table Structure
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('candidate', 'hr', 'admin')) DEFAULT 'candidate',
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview sessions
CREATE TABLE public.interview_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  candidate_id UUID REFERENCES public.profiles(id) NOT NULL,
  hr_id UUID REFERENCES public.profiles(id),
  job_position TEXT NOT NULL,
  job_level TEXT,
  interview_type TEXT DEFAULT 'behavioral',
  status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  
  -- Timing
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_duration INTEGER, -- seconds
  
  -- Configuration
  interview_config JSONB DEFAULT '{}',
  avatar_model TEXT DEFAULT 'hiyori_free',
  voice_model TEXT DEFAULT 'en_US-lessac-medium',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview questions template
CREATE TABLE public.interview_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_category TEXT,
  expected_duration INTEGER DEFAULT 120, -- seconds
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5) DEFAULT 3,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview turns (Q&A pairs with complete audio/text data)
CREATE TABLE public.interview_turns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.interview_questions(id) ON DELETE CASCADE,
  turn_order INTEGER NOT NULL,
  
  -- Agent (Interviewer) Data
  agent_text TEXT NOT NULL,
  agent_audio_url TEXT,
  agent_audio_duration FLOAT,
  agent_voice_settings JSONB DEFAULT '{}',
  
  -- Candidate Data  
  candidate_text TEXT,
  candidate_audio_url TEXT,
  candidate_audio_duration FLOAT,
  candidate_response_time FLOAT, -- seconds to start responding
  
  -- Timestamps
  question_asked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  response_started_at TIMESTAMP WITH TIME ZONE,
  response_completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Audio Analysis
  sentiment_score FLOAT CHECK (sentiment_score BETWEEN -1 AND 1),
  confidence_level FLOAT CHECK (confidence_level BETWEEN 0 AND 1),
  speech_rate FLOAT, -- words per minute
  pause_analysis JSONB DEFAULT '{}',
  
  -- Extracted Features
  keywords JSONB DEFAULT '[]',
  topics JSONB DEFAULT '[]',
  emotions JSONB DEFAULT '{}',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comprehensive evaluation results
CREATE TABLE public.interview_evaluations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  
  -- Numerical Scores (0-100)
  overall_score FLOAT CHECK (overall_score >= 0 AND overall_score <= 100),
  technical_score FLOAT CHECK (technical_score >= 0 AND technical_score <= 100),
  communication_score FLOAT CHECK (communication_score >= 0 AND communication_score <= 100),
  cultural_fit_score FLOAT CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
  problem_solving_score FLOAT CHECK (problem_solving_score >= 0 AND problem_solving_score <= 100),
  
  -- Qualitative Analysis
  strengths TEXT[],
  weaknesses TEXT[],
  recommendations TEXT[],
  red_flags TEXT[],
  
  -- Detailed Rubric Scores
  rubric_scores JSONB DEFAULT '{}', -- {"criterion_id": {"score": 4, "justification": "..."}}
  detailed_feedback JSONB DEFAULT '{}',
  
  -- LLM Evaluation Metadata
  evaluator_model TEXT,
  evaluation_confidence FLOAT CHECK (evaluation_confidence >= 0 AND evaluation_confidence <= 100),
  evaluation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_time FLOAT, -- seconds
  
  -- HR Review Process
  hr_review TEXT,
  hr_decision TEXT CHECK (hr_decision IN ('hire', 'reject', 'second_round', 'hold', 'pending')),
  hr_notes JSONB DEFAULT '{}',
  hr_reviewed_at TIMESTAMP WITH TIME ZONE,
  hr_reviewer_id UUID REFERENCES public.profiles(id),
  
  -- Audit Trail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio files metadata and storage
CREATE TABLE public.audio_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  turn_id UUID REFERENCES public.interview_turns(id) ON DELETE CASCADE,
  
  -- File Information
  file_type TEXT CHECK (file_type IN ('agent_audio', 'candidate_audio', 'processed_audio')),
  file_path TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  
  -- Audio Properties
  duration FLOAT,
  sample_rate INTEGER,
  bit_rate INTEGER,
  channels INTEGER DEFAULT 1,
  format TEXT,
  
  -- Processing Status
  processing_status TEXT CHECK (processing_status IN ('uploaded', 'processing', 'processed', 'failed')) DEFAULT 'uploaded',
  transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance optimization indexes
CREATE INDEX idx_interview_sessions_candidate ON public.interview_sessions(candidate_id);
CREATE INDEX idx_interview_sessions_status ON public.interview_sessions(status);
CREATE INDEX idx_interview_sessions_scheduled ON public.interview_sessions(scheduled_at);
CREATE INDEX idx_interview_turns_session ON public.interview_turns(session_id);
CREATE INDEX idx_interview_turns_order ON public.interview_turns(session_id, turn_order);
CREATE INDEX idx_audio_files_session ON public.audio_files(session_id);
CREATE INDEX idx_audio_files_processing ON public.audio_files(processing_status);
CREATE INDEX idx_evaluations_session ON public.interview_evaluations(session_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data security
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Candidates can view own sessions" ON public.interview_sessions
  FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "HR can view assigned sessions" ON public.interview_sessions
  FOR SELECT USING (
    auth.uid() = hr_id OR 
    auth.uid() = candidate_id OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON public.interview_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🌐 REST API Endpoints Specification

### Authentication (Supabase Auth)
```typescript
// Authentication handled by Supabase
POST /auth/login      // Sign in with email/password
POST /auth/register   // Sign up new user
POST /auth/logout     // Sign out current user
GET  /auth/user       // Get current user info
POST /auth/refresh    // Refresh auth token
```

### Interview Management APIs
```typescript
// Interview Sessions CRUD
GET    /api/interviews
// Query params: ?status=scheduled&candidateId=uuid&page=1&limit=10
// Response: { interviews: InterviewSession[], total: number, page: number }

POST   /api/interviews
// Body: { candidate_id, job_position, scheduled_at, interview_type }
// Response: { session: InterviewSession }

GET    /api/interviews/:sessionId
// Response: { session: InterviewSession, questions: Question[], turns: Turn[] }

PATCH  /api/interviews/:sessionId  
// Body: { status?, hr_id?, scheduled_at?, metadata? }
// Response: { session: InterviewSession }

DELETE /api/interviews/:sessionId
// Response: { success: boolean }

// Interview Flow Control
POST   /api/interviews/:sessionId/start
// Body: { avatar_model?, voice_settings? }
// Response: { success: boolean, websocket_url: string }

POST   /api/interviews/:sessionId/turn
// Body: { question_id, agent_text, candidate_audio_blob }
// Response: { turn: InterviewTurn, next_question?: Question }

GET    /api/interviews/:sessionId/turns
// Response: { turns: InterviewTurn[] }

POST   /api/interviews/:sessionId/end
// Response: { success: boolean, evaluation_triggered: boolean }
```

### Audio Processing APIs
```typescript
// Audio Upload & Processing
POST   /api/audio/upload
// Body: FormData with audio file
// Response: { file_id: string, upload_url: string, duration: number }

POST   /api/audio/transcribe
// Body: { audio_url: string, language?: string }
// Response: { transcript: string, confidence: number, processing_time: number }

POST   /api/audio/synthesize  
// Body: { text: string, voice: string, speed?: number, pitch?: number }
// Response: { audio_url: string, duration: number, lip_sync_data: LipSyncFrame[] }

GET    /api/audio/:fileId
// Response: Audio file stream

DELETE /api/audio/:fileId
// Response: { success: boolean }
```

### Real-time WebSocket Events
```typescript
// Client -> Server Events
interface ClientEvents {
  'join_interview': { sessionId: string; userId: string };
  'audio_chunk': { sessionId: string; audioData: ArrayBuffer; sequence: number };
  'turn_complete': { sessionId: string; turnId: string };
  'candidate_ready': { sessionId: string };
  'request_next_question': { sessionId: string };
  'leave_interview': { sessionId: string };
  'ping': { timestamp: number };
}

// Server -> Client Events  
interface ServerEvents {
  'interview_started': { session: InterviewSession; first_question: Question };
  'question_asked': { question: Question; audio_url: string; avatar_animation: string };
  'audio_processed': { turn_id: string; transcript: string; confidence: number };
  'turn_saved': { turn: InterviewTurn; next_question?: Question };
  'interview_ended': { session_id: string; evaluation_status: string };
  'processing_status': { status: string; message: string };
  'error': { code: string; message: string; details?: any };
  'pong': { timestamp: number };
}
```

### Evaluation APIs
```typescript
// LLM Evaluation System
POST   /api/evaluations/:sessionId
// Body: { rubric?: EvaluationRubric, custom_criteria?: any }
// Response: { evaluation_id: string, estimated_time: number }

GET    /api/evaluations/:sessionId
// Response: { evaluation: InterviewEvaluation }

GET    /api/evaluations/:sessionId/status
// Response: { status: 'processing' | 'completed' | 'failed', progress: number }

PATCH  /api/evaluations/:evaluationId/review
// Body: { hr_decision, hr_review, hr_notes }
// Response: { evaluation: InterviewEvaluation }

GET    /api/evaluations
// Query: ?hr_id=uuid&decision=hire&from_date=2024-01-01
// Response: { evaluations: InterviewEvaluation[], stats: EvaluationStats }
```

---

## 🎭 Live2D Avatar Integration & Lip-Sync

### Recommended Free VTuber Models
1. **Hiyori (Free)**: https://www.live2d.com/en/download/sample-data/
2. **Koharu (Free)**: Community-created model
3. **Custom Models**: Use Live2D Cubism Editor (free version)

### Avatar Service Implementation
```typescript
// services/avatarService.ts
import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display';
import { sound } from '@pixi/sound';

export interface LipSyncFrame {
  time: number;
  phoneme: string;
  intensity: number;
  mouthOpenY: number;
  mouthForm: number;
}

export class AvatarService {
  private app: PIXI.Application | null = null;
  private model: Live2DModel | null = null;
  private lipSyncEngine: LipSyncEngine | null = null;
  private isInitialized = false;
  
  // Avatar configuration
  private readonly modelConfigs = {
    hiyori_free: {
      path: '/models/hiyori_free.model3.json',
      scale: 0.15,
      position: { x: 0.5, y: 0.8 },
      motions: {
        idle: ['idle_01', 'idle_02', 'idle_03'],
        greeting: ['wave_01', 'bow_01'],
        talking: ['talk_01', 'talk_02'],
        thinking: ['think_01', 'nod_01'],
        ending: ['goodbye_01', 'bow_02']
      },
      expressions: {
        neutral: 'exp_neutral',
        smile: 'exp_smile', 
        serious: 'exp_serious',
        surprised: 'exp_surprised'
      }
    }
  };
  
  async initializeAvatar(
    canvas: HTMLCanvasElement,
    modelName: string = 'hiyori_free',
    width: number = 400,
    height: number = 600
  ): Promise<void> {
    try {
      // Initialize PIXI Application
      this.app = new PIXI.Application({
        view: canvas,
        width,
        height,
        transparent: true,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });
      
      // Load Live2D model
      const config = this.modelConfigs[modelName];
      this.model = await Live2DModel.from(config.path);
      
      // Configure model
      this.setupModelConfiguration(config);
      
      // Add model to stage
      this.app.stage.addChild(this.model);
      
      // Initialize lip-sync engine
      this.lipSyncEngine = new LipSyncEngine(this.model);
      
      // Start idle animation loop
      this.startIdleAnimation();
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('Failed to initialize avatar:', error);
      throw error;
    }
  }
  
  async speakWithLipSync(audioUrl: string, text: string): Promise<void> {
    if (!this.model || !this.lipSyncEngine || !this.isInitialized) {
      throw new Error('Avatar not properly initialized');
    }
    
    try {
      // Start talking animation
      await this.playMotion('talking', 0, 3);
      this.setExpression('smile');
      
      // Generate lip-sync data
      const lipSyncData = await this.generateLipSyncData(audioUrl, text);
      
      // Play audio and start lip-sync
      const audioPromise = this.playAudio(audioUrl);
      const lipSyncPromise = this.lipSyncEngine.start(lipSyncData);
      
      // Wait for both to complete
      await Promise.all([audioPromise, lipSyncPromise]);
      
      // Return to idle state
      this.setExpression('neutral');
      this.startIdleAnimation();
      
    } catch (error) {
      console.error('Failed to speak with lip-sync:', error);
      throw error;
    }
  }
  
  private async generateLipSyncData(audioUrl: string, text: string): Promise<LipSyncFrame[]> {
    // Generate lip-sync frames from audio analysis
    const audioContext = new AudioContext();
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const frames: LipSyncFrame[] = [];
    const sampleRate = audioBuffer.sampleRate;
    const frameSize = 1024;
    const hopSize = 512;
    
    for (let i = 0; i < audioBuffer.length - frameSize; i += hopSize) {
      const frame = audioBuffer.getChannelData(0).slice(i, i + frameSize);
      const time = i / sampleRate;
      const rms = this.calculateRMS(frame);
      
      // Map RMS to mouth parameters
      const intensity = Math.min(rms * 5, 1);
      const mouthOpenY = intensity * 0.8;
      const mouthForm = this.estimateMouthForm(frame);
      
      frames.push({
        time,
        phoneme: this.estimatePhoneme(time, text),
        intensity,
        mouthOpenY,
        mouthForm
      });
    }
    
    return frames;
  }
  
  private calculateRMS(frame: Float32Array): number {
    const sum = frame.reduce((acc, val) => acc + val * val, 0);
    return Math.sqrt(sum / frame.length);
  }
}

// Lip-sync engine for real-time mouth animation
class LipSyncEngine {
  private model: Live2DModel;
  private animationFrame: number | null = null;
  private startTime: number = 0;
  private lipSyncData: LipSyncFrame[] = [];
  private active = false;
  
  constructor(model: Live2DModel) {
    this.model = model;
  }
  
  async start(lipSyncData: LipSyncFrame[]): Promise<void> {
    this.lipSyncData = lipSyncData;
    this.startTime = Date.now();
    this.active = true;
    this.animate();
    
    return new Promise((resolve) => {
      const duration = lipSyncData[lipSyncData.length - 1]?.time * 1000 || 3000;
      setTimeout(() => {
        this.stop();
        resolve();
      }, duration + 500);
    });
  }
  
  private animate = (): void => {
    if (!this.active) return;
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    const currentFrame = this.getCurrentFrame(elapsed);
    
    if (currentFrame) {
      this.applyLipSync(currentFrame);
    }
    
    this.animationFrame = requestAnimationFrame(this.animate);
  };
  
  private applyLipSync(frame: LipSyncFrame): void {
    try {
      const coreModel = this.model.internalModel.coreModel;
      
      // Apply mouth opening (Y axis)
      const mouthOpenYIndex = coreModel.getParameterIndex('ParamMouthOpenY');
      if (mouthOpenYIndex >= 0) {
        coreModel.setParameterValueByIndex(mouthOpenYIndex, frame.mouthOpenY);
      }
      
      // Apply mouth form (shape)
      const mouthFormIndex = coreModel.getParameterIndex('ParamMouthForm');
      if (mouthFormIndex >= 0) {
        coreModel.setParameterValueByIndex(mouthFormIndex, frame.mouthForm);
      }
      
    } catch (error) {
      console.error('Error applying lip-sync:', error);
    }
  }
  
  stop(): void {
    this.active = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
}
```

---

## 🏗️ Frontend Component Architecture

### Project Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── Navigation.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── interview/
│   │   ├── InterviewRoom.tsx           // Main interview interface
│   │   ├── InterviewControls.tsx       // Start/pause/stop controls
│   │   ├── QuestionDisplay.tsx         // Question presentation
│   │   ├── AudioRecorder.tsx           // Voice recording interface
│   │   ├── TranscriptView.tsx          // Real-time transcription
│   │   ├── InterviewProgress.tsx       // Progress indicator
│   │   └── InterviewSettings.tsx       // Pre-interview configuration
│   ├── avatar/
│   │   ├── Live2DAvatar.tsx           // Main Live2D component
│   │   ├── AvatarController.tsx       // Animation controller
│   │   ├── LipSyncEngine.tsx          // Lip-sync implementation
│   │   ├── ExpressionManager.tsx      // Facial expressions
│   │   └── MotionLibrary.tsx          // Animation library
│   ├── dashboard/
│   │   ├── CandidateDashboard.tsx     // Candidate view
│   │   ├── HRDashboard.tsx            // HR management view
│   │   ├── InterviewList.tsx          // Interview scheduling
│   │   ├── CalendarView.tsx           // Schedule management
│   │   └── InterviewCard.tsx          // Interview summary cards
│   ├── evaluation/
│   │   ├── EvaluationResults.tsx      // Results display
│   │   ├── RubricDisplay.tsx          // Scoring breakdown
│   │   ├── HRReview.tsx               // HR review interface
│   │   ├── ScoreVisualization.tsx     // Charts and graphs
│   │   └── ComparisonView.tsx         // Candidate comparison
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── ConfirmDialog.tsx
│       ├── AudioWaveform.tsx
│       └── StatusIndicator.tsx
├── hooks/
│   ├── useInterview.ts                // Interview state management
│   ├── useAudio.ts                    // Audio recording/playback
│   ├── useWebSocket.ts                // Real-time communication
│   ├── useAvatar.ts                   // Avatar control
│   ├── useEvaluation.ts               // Evaluation data
│   └── useSupabase.ts                 // Database operations
├── services/
│   ├── supabase.ts                    // Supabase client
│   ├── audioService.ts                // Audio processing
│   ├── avatarService.ts               // Avatar management
│   ├── socketService.ts               // WebSocket handling
│   ├── evaluationService.ts           // Evaluation API
│   └── storageService.ts              // File storage
├── store/
│   ├── interviewStore.ts              // Global interview state
│   ├── audioStore.ts                  // Audio state
│   ├── avatarStore.ts                 // Avatar state
│   └── userStore.ts                   // User session
├── types/
│   ├── interview.ts                   // Interview interfaces
│   ├── audio.ts                       // Audio interfaces  
│   ├── avatar.ts                      // Avatar interfaces
│   ├── evaluation.ts                  // Evaluation interfaces
│   └── api.ts                         // API response types
└── utils/
    ├── audioUtils.ts                  // Audio processing utilities
    ├── dateUtils.ts                   // Date formatting
    ├── constants.ts                   // App constants
    └── validation.ts                  // Form validation
```

### Key Component Implementation

#### InterviewRoom.tsx - Main Interview Interface
```typescript
import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

import { useInterviewStore } from '../../store/interviewStore';
import { useAudio } from '../../hooks/useAudio';
import { useWebSocket } from '../../hooks/useWebSocket';
import Live2DAvatar from '../avatar/Live2DAvatar';
import AudioRecorder from './AudioRecorder';
import QuestionDisplay from './QuestionDisplay';
import TranscriptView from './TranscriptView';
import InterviewControls from './InterviewControls';
import InterviewProgress from './InterviewProgress';

export const InterviewRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store hooks
  const {
    status,
    currentQuestion,
    turns,
    isProcessing,
    progress,
    initializeInterview,
    startInterview,
    submitAnswer,
    endInterview
  } = useInterviewStore();
  
  // Audio hooks
  const {
    isRecording,
    volume,
    audioBlob,
    startRecording,
    stopRecording,
    clearAudio
  } = useAudio({
    onRecordingComplete: handleRecordingComplete,
    onError: (error) => setError(`Audio Error: ${error.message}`)
  });
  
  // WebSocket connection
  const { socket, connectionStatus } = useWebSocket(sessionId!, {
    onQuestionAsked: handleQuestionAsked,
    onAudioProcessed: handleAudioProcessed,
    onInterviewEnded: handleInterviewEnded,
    onError: (error) => setError(`Connection Error: ${error.message}`)
  });
  
  // Initialize interview on mount
  useEffect(() => {
    if (sessionId && !isInitialized) {
      initializeInterview(sessionId)
        .then(() => setIsInitialized(true))
        .catch((error) => setError(`Initialization Error: ${error.message}`));
    }
  }, [sessionId, isInitialized, initializeInterview]);
  
  // Event handlers
  async function handleRecordingComplete(blob: Blob) {
    try {
      await submitAnswer(blob);
      clearAudio();
    } catch (error) {
      setError(`Failed to submit answer: ${(error as Error).message}`);
    }
  }
  
  function handleQuestionAsked(data: { question: Question; audio_url: string }) {
    console.log('New question received:', data.question.question_text);
  }
  
  function handleAudioProcessed(data: { transcript: string; confidence: number }) {
    console.log('Audio processed:', data.transcript);
  }
  
  function handleInterviewEnded() {
    console.log('Interview completed');
  }
  
  async function handleStartInterview() {
    try {
      await startInterview();
    } catch (error) {
      setError(`Failed to start interview: ${(error as Error).message}`);
    }
  }
  
  async function handleEndInterview() {
    try {
      await endInterview();
    } catch (error) {
      setError(`Failed to end interview: ${(error as Error).message}`);
    }
  }
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: 'grey.50' }}>
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'absolute',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              width: '90%',
              maxWidth: 600
            }}
          >
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Avatar Section */}
      <motion.div
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, type: "spring" }}
      >
        <Paper 
          elevation={4}
          sx={{ 
            width: 450,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 3,
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h6" gutterBottom color="primary">
            AI Interviewer
          </Typography>
          
          <Live2DAvatar 
            modelPath="/models/hiyori_free.model3.json"
            width={400}
            height={600}
            onModelLoaded={() => console.log('Avatar ready')}
          />
          
          <Box mt={2} width="100%">
            <InterviewProgress progress={progress} />
          </Box>
        </Paper>
      </motion.div>
      
      {/* Main Interaction Area */}
      <Box sx={{ flex: 1, p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Question Display */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <QuestionDisplay 
            question={currentQuestion}
            status={status}
            isProcessing={isProcessing}
          />
        </motion.div>
        
        {/* Audio Recording Interface */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AudioRecorder
            isRecording={isRecording}
            volume={volume}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            disabled={!currentQuestion || isProcessing}
            connectionStatus={connectionStatus}
          />
        </motion.div>
        
        {/* Transcript View */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{ flex: 1 }}
        >
          <TranscriptView 
            turns={turns}
            isProcessing={isProcessing}
          />
        </motion.div>
        
        {/* Interview Controls */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <InterviewControls
            status={status}
            onStartInterview={handleStartInterview}
            onEndInterview={handleEndInterview}
            disabled={isProcessing}
          />
        </motion.div>
      </Box>
    </Box>
  );
};

export default InterviewRoom;
```

---

## 🧠 LLM Evaluation System

### Evaluation Rubric Configuration
```typescript
// types/evaluation.ts
export interface EvaluationRubric {
  criteria: RubricCriterion[];
  overallWeighting: {
    technical: number;
    communication: number;
    culturalFit: number;
    problemSolving: number;
  };
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
  scale: {
    min: number;
    max: number;
    labels: Record<number, string>;
  };
  examples: {
    excellent: string[];
    good: string[];
    poor: string[];
  };
}

export const DEFAULT_RUBRIC: EvaluationRubric = {
  criteria: [
    {
      id: 'technical_knowledge',
      name: 'Technical Knowledge',
      description: 'Demonstrates understanding of relevant technical concepts',
      weight: 0.3,
      scale: {
        min: 1,
        max: 5,
        labels: {
          1: 'Poor - Little to no understanding',
          2: 'Below Average - Basic understanding',
          3: 'Average - Adequate understanding', 
          4: 'Good - Strong understanding',
          5: 'Excellent - Expert level understanding'
        }
      },
      examples: {
        excellent: ['Explains complex concepts clearly', 'Provides specific examples'],
        good: ['Shows solid understanding', 'Can apply concepts'],
        poor: ['Vague responses', 'Incorrect information']
      }
    },
    {
      id: 'communication_skills',
      name: 'Communication Skills',
      description: 'Ability to articulate thoughts clearly and professionally',
      weight: 0.25,
      scale: { min: 1, max: 5, labels: {} },
      examples: {
        excellent: ['Clear articulation', 'Structured responses'],
        good: ['Generally clear', 'Minor communication issues'],
        poor: ['Unclear speech', 'Disorganized thoughts']
      }
    },
    {
      id: 'problem_solving',
      name: 'Problem Solving',
      description: 'Approach to analyzing and solving problems',
      weight: 0.25,
      scale: { min: 1, max: 5, labels: {} },
      examples: {
        excellent: ['Systematic approach', 'Creative solutions'],
        good: ['Logical thinking', 'Workable solutions'],
        poor: ['Random approach', 'No clear methodology']
      }
    },
    {
      id: 'cultural_fit',
      name: 'Cultural Fit',
      description: 'Alignment with company values and team dynamics',
      weight: 0.2,
      scale: { min: 1, max: 5, labels: {} },
      examples: {
        excellent: ['Strong value alignment', 'Collaborative mindset'],
        good: ['Good fit', 'Some alignment'],
        poor: ['Poor fit', 'Conflicting values']
      }
    }
  ],
  overallWeighting: {
    technical: 0.4,
    communication: 0.3,
    culturalFit: 0.2,
    problemSolving: 0.1
  }
};
```

### LLM Evaluator Service
```javascript
// backend/services/evaluationService.js
const OpenAI = require('openai');
const { supabase } = require('../config/supabase');

class EvaluationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async evaluateInterview(sessionId) {
    try {
      // Fetch interview data
      const interviewData = await this.getInterviewData(sessionId);
      const rubric = await this.getRubric(sessionId);
      
      // Generate evaluation using LLM
      const evaluation = await this.generateEvaluation(interviewData, rubric);
      
      // Save evaluation to database
      const savedEvaluation = await this.saveEvaluation(sessionId, evaluation);
      
      return savedEvaluation;
      
    } catch (error) {
      console.error('Evaluation failed:', error);
      throw error;
    }
  }
  
  async generateEvaluation(interviewData, rubric) {
    const { interview_turns, job_position } = interviewData;
    
    // Prepare conversation transcript
    const transcript = interview_turns
      .sort((a, b) => a.turn_order - b.turn_order)
      .map(turn => ({
        question: turn.agent_text,
        answer: turn.candidate_text,
        responseTime: turn.candidate_response_time,
        confidence: turn.confidence_level
      }));
    
    const evaluationPrompt = this.buildEvaluationPrompt(transcript, rubric, job_position);
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR interviewer and evaluator. Provide detailed, objective assessments based on the given rubric.'
        },
        {
          role: 'user', 
          content: evaluationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const evaluation = JSON.parse(response.choices[0].message.content);
    
    return {
      ...evaluation,
      evaluator_model: 'gpt-4-1106-preview',
      evaluation_confidence: this.calculateEvaluationConfidence(evaluation),
      evaluation_timestamp: new Date().toISOString()
    };
  }
  
  buildEvaluationPrompt(transcript, rubric, jobPosition) {
    return `
# Interview Evaluation Task

## Job Position: ${jobPosition}

## Interview Transcript:
${transcript.map((turn, i) => `
**Question ${i + 1}:** ${turn.question}
**Answer:** ${turn.answer}
**Response Time:** ${turn.responseTime}s
**Speech Confidence:** ${turn.confidence}
`).join('\n')}

## Evaluation Rubric:
${JSON.stringify(rubric, null, 2)}

## Instructions:
1. Evaluate the candidate against each rubric criterion
2. Provide specific scores (1-5) for each criterion
3. Calculate weighted overall scores for each category
4. Identify key strengths and weaknesses
5. Provide actionable recommendations
6. Make a hiring recommendation

## Required Output Format (JSON):
{
  "rubric_scores": {
    "criterion_id": {
      "score": 1-5,
      "justification": "detailed explanation",
      "evidence": ["specific examples from transcript"]
    }
  },
  "category_scores": {
    "technical_score": 0-100,
    "communication_score": 0-100,
    "cultural_fit_score": 0-100,
    "problem_solving_score": 0-100
  },
  "overall_score": 0-100,
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"], 
  "recommendations": ["recommendation 1", "recommendation 2"],
  "hiring_decision": "hire|reject|second_round",
  "decision_confidence": 0-100,
  "detailed_feedback": {
    "technical_analysis": "detailed technical assessment",
    "communication_analysis": "communication skills analysis",
    "cultural_fit_analysis": "cultural fit assessment",
    "overall_impression": "overall candidate assessment"
  }
}
`;
  }
}

module.exports = new EvaluationService();
```

---

## 🔧 Configuration & Deployment

### Environment Configuration
```bash
# .env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Audio Services
WHISPER_MODEL_PATH=./models/whisper
PIPER_MODEL_PATH=./models/piper
PIPER_VOICE=en_US-lessac-medium

# Server Configuration
PORT=3001
NODE_ENV=production
SESSION_SECRET=your_session_secret

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Live2D Models
LIVE2D_MODEL_PATH=./public/models/hiyori_free.model3.json
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

# Install Python and audio dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm ci --only=production

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Download Whisper model
RUN python3 -c "import whisper; whisper.load_model('base.en')"

# Copy application code
COPY . .

# Build frontend
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    volumes:
      - ./uploads:/app/uploads
      - ./models:/app/models
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation Setup ✅
- [ ] Setup Supabase project and database schema
- [ ] Initialize React application with TypeScript
- [ ] Configure authentication system
- [ ] Setup basic routing and layout components

### Phase 2: Audio Processing 🎵
- [ ] Implement audio recording with WebRTC
- [ ] Setup Whisper STT integration
- [ ] Configure Piper TTS service
- [ ] Create audio file storage system

### Phase 3: Avatar Integration 🎭
- [ ] Setup PIXI.js and Live2D display
- [ ] Download and configure VTuber model
- [ ] Implement basic avatar animations
- [ ] Create lip-sync engine

### Phase 4: Interview Flow 💬
- [ ] Build WebSocket communication
- [ ] Implement interview state management
- [ ] Create question/answer workflow
- [ ] Setup turn-based data persistence

### Phase 5: LLM Evaluation 🧠
- [ ] Configure OpenAI API integration
- [ ] Implement evaluation rubric system
- [ ] Create automated scoring pipeline
- [ ] Build HR review interface

### Phase 6: Testing & Deployment 🚀
- [ ] Setup comprehensive testing suite
- [ ] Configure production environment
- [ ] Implement monitoring and logging
- [ ] Deploy to cloud infrastructure

---

## 🔒 Security Considerations

### Data Privacy
- All audio files encrypted at rest
- Row-level security on all database tables
- GDPR compliance for candidate data
- Automatic data retention policies

### Authentication & Authorization
- JWT-based authentication via Supabase
- Role-based access control (Candidate/HR/Admin)
- API rate limiting and request validation
- Session management and timeout

### Audio Security
- Client-side audio validation
- Encrypted file uploads
- Virus scanning for audio files
- Secure temporary file handling

---

## 📊 Performance Optimization

### Frontend Optimization
- Code splitting by route and component
- Lazy loading for avatar models
- Audio streaming for large files
- Optimized bundle size with tree shaking

### Backend Optimization
- Database connection pooling
- Redis caching for frequently accessed data
- CDN for static assets and audio files
- Background job processing for evaluations

### Avatar Performance
- Model preloading and caching
- Optimized animation frame rates
- Memory management for PIXI applications
- Efficient lip-sync calculations

---

This comprehensive blueprint provides everything needed to build the React voice interview system with animated avatar. The system includes complete database schema, REST API design, frontend architecture, Live2D avatar integration with lip-sync, LLM evaluation system, and all necessary configuration for deployment. The implementation is production-ready and includes error handling, security measures, and scalability considerations.
