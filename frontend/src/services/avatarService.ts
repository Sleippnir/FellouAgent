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
      path: '/models/hiyori_free/Hiyori.model3.json', // Corrected path
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

  private setupModelConfiguration(config: any): void {
    if (!this.model || !this.app) return;
    this.model.scale.set(config.scale);
    this.model.x = this.app.screen.width * config.position.x;
    this.model.y = this.app.screen.height * config.position.y;
  }

  public async speakWithLipSync(audioUrl: string, text: string): Promise<void> {
    if (!this.model || !this.lipSyncEngine || !this.isInitialized) {
      throw new Error('Avatar not properly initialized');
    }

    try {
      // For now, we'll just play a talking animation and the audio
      // The lip-sync generation is complex and will be improved later.
      this.model.motion('talking');

      // Play audio
      const audio = sound.find('tts-audio');
      if (audio) {
        audio.stop();
        sound.remove('tts-audio');
      }
      sound.add('tts-audio', audioUrl);
      await sound.play('tts-audio');

      // Return to idle state after audio finishes
      this.model.motion('idle');

    } catch (error) {
      console.error('Failed to speak with lip-sync:', error);
      this.model.motion('idle'); // Ensure we return to idle on error
      throw error;
    }
  }

  private startIdleAnimation(): void {
    if (!this.model) return;
    this.model.motion('idle');
  }

  // NOTE: The LipSyncEngine and its associated methods from the README are very complex
  // and rely on client-side audio analysis that may not be feasible or performant.
  // For this implementation, we are simplifying the `speakWithLipSync` method
  // and will revisit the lip-sync generation later.
}

// A simplified LipSyncEngine for now. The full implementation is deferred.
class LipSyncEngine {
  private model: Live2DModel;

  constructor(model: Live2DModel) {
    this.model = model;
  }

  // Placeholder for the complex lip-sync logic
  public async start(lipSyncData: LipSyncFrame[]): Promise<void> {
    console.log("Lip-sync started (placeholder)");
    return Promise.resolve();
  }

  public stop(): void {
    console.log("Lip-sync stopped (placeholder)");
  }
}
