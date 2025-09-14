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
