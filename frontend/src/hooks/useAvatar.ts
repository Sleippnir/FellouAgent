import { useState, useRef, useCallback } from 'react';
import { AvatarService } from '../services/avatarService';
import axios from 'axios';

export const useAvatar = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarService = useRef(new AvatarService());

  const initialize = useCallback(async (canvas: HTMLCanvasElement) => {
    try {
      await avatarService.current.initializeAvatar(canvas);
      setIsInitialized(true);
    } catch (err) {
      console.error(err);
      setError('Failed to initialize avatar.');
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!isInitialized) {
      setError('Avatar is not initialized.');
      return;
    }

    setIsSpeaking(true);
    setError(null);

    try {
      // 1. Get the synthesized audio from the backend
      const response = await axios.post(
        '/api/audio/synthesize',
        { text },
        { responseType: 'blob' }
      );

      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);

      // 2. Pass the audio to the avatar service to speak
      await avatarService.current.speakWithLipSync(audioUrl, text);

    } catch (err) {
      console.error(err);
      setError('Failed to synthesize or play audio.');
    } finally {
      setIsSpeaking(false);
    }
  }, [isInitialized]);

  return {
    isInitialized,
    isSpeaking,
    error,
    initialize,
    speak,
  };
};
