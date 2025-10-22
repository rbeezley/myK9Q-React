/**
 * Voice Announcement Service
 *
 * Provides text-to-speech announcements for scoring events using the Web Speech API.
 * Features:
 * - Multi-language support
 * - Voice selection (male/female, different accents)
 * - Rate and pitch control
 * - Queue management for multiple announcements
 * - Settings integration
 *
 * Browser Support:
 * - Chrome/Edge: Full support ✅
 * - Safari: Full support ✅
 * - Firefox: Partial support (limited voices) ⚠️
 * - Mobile: iOS 7+, Android 4.4+ ✅
 */

export interface VoiceConfig {
  /** Voice to use (defaults to system default) */
  voice: SpeechSynthesisVoice | null;
  /** Language code (e.g., 'en-US', 'es-ES') */
  lang: string;
  /** Speech rate (0.1 to 10, default: 1) */
  rate: number;
  /** Speech pitch (0 to 2, default: 1) */
  pitch: number;
  /** Speech volume (0 to 1, default: 1) */
  volume: number;
}

export interface AnnouncementOptions {
  /** Text to announce */
  text: string;
  /** Priority (high priority interrupts current speech) */
  priority?: 'low' | 'normal' | 'high';
  /** Custom voice configuration */
  voiceConfig?: Partial<VoiceConfig>;
  /** Callback when announcement completes */
  onEnd?: () => void;
  /** Callback on error */
  onError?: (error: SpeechSynthesisErrorEvent) => void;
}

class VoiceAnnouncementService {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private queue: SpeechSynthesisUtterance[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isEnabled: boolean = false;
  private defaultConfig: VoiceConfig = {
    voice: null,
    lang: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();

      // Voices may load asynchronously, listen for the event
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  /**
   * Load available voices from the browser
   */
  private loadVoices(): void {
    if (!this.synthesis) return;

    this.voices = this.synthesis.getVoices();

    // Set default voice to first en-US voice if available
    if (!this.defaultConfig.voice && this.voices.length > 0) {
      const enUSVoice = this.voices.find(v => v.lang === 'en-US');
      this.defaultConfig.voice = enUSVoice || this.voices[0];
    }
  }

  /**
   * Get all available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  /**
   * Get voices filtered by language
   */
  public getVoicesByLanguage(lang: string): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.startsWith(lang));
  }

  /**
   * Get the default voice configuration
   */
  public getDefaultConfig(): VoiceConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Update the default voice configuration
   */
  public setDefaultConfig(config: Partial<VoiceConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  /**
   * Enable or disable voice announcements
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.cancelAll();
    }
  }

  /**
   * Check if voice announcements are enabled
   */
  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Check if the browser supports speech synthesis
   */
  public isSupported(): boolean {
    return this.synthesis !== null;
  }

  /**
   * Announce text using speech synthesis
   */
  public announce(options: AnnouncementOptions): void {
    if (!this.isEnabled || !this.synthesis) {
      return;
    }

    const utterance = this.createUtterance(options);

    // Handle priority
    if (options.priority === 'high') {
      this.cancelAll();
      this.speak(utterance);
    } else if (options.priority === 'normal' && this.currentUtterance) {
      this.cancel();
      this.speak(utterance);
    } else {
      this.speak(utterance);
    }
  }

  /**
   * Create a speech synthesis utterance from options
   */
  private createUtterance(options: AnnouncementOptions): SpeechSynthesisUtterance {
    const utterance = new SpeechSynthesisUtterance(options.text);

    // Apply voice configuration
    const config = { ...this.defaultConfig, ...(options.voiceConfig || {}) };

    if (config.voice) {
      utterance.voice = config.voice;
    }
    utterance.lang = config.lang;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    // Set up callbacks
    utterance.onend = () => {
      this.currentUtterance = null;
      if (options.onEnd) {
        options.onEnd();
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.currentUtterance = null;
      if (options.onError) {
        options.onError(event);
      }
    };

    return utterance;
  }

  /**
   * Speak an utterance
   */
  private speak(utterance: SpeechSynthesisUtterance): void {
    if (!this.synthesis) return;

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  /**
   * Cancel the current announcement
   */
  public cancel(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Cancel all queued announcements
   */
  public cancelAll(): void {
    this.cancel();
    this.queue = [];
  }

  /**
   * Pause current announcement
   */
  public pause(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }

  /**
   * Resume paused announcement
   */
  public resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synthesis?.speaking ?? false;
  }

  /**
   * Check if currently paused
   */
  public isPaused(): boolean {
    return this.synthesis?.paused ?? false;
  }

  // ========================================
  // PRESET ANNOUNCEMENTS FOR SCORING
  // ========================================

  /**
   * Announce timer countdown (e.g., "30 seconds remaining")
   */
  public announceTimeRemaining(seconds: number): void {
    let text = '';

    if (seconds === 30) {
      text = '30 seconds remaining';
    } else if (seconds === 10) {
      text = '10 seconds remaining';
    } else if (seconds <= 5 && seconds > 0) {
      text = `${seconds}`;
    } else if (seconds === 0) {
      text = 'Time';
    }

    if (text) {
      this.announce({
        text,
        priority: 'high',
      });
    }
  }

  /**
   * Announce class/run number
   */
  public announceRunNumber(armbandNumber: string, dogName: string): void {
    this.announce({
      text: `Number ${armbandNumber}, ${dogName}`,
      priority: 'normal',
    });
  }

  /**
   * Announce qualification status
   */
  public announceQualification(qualified: boolean, score?: number): void {
    let text = qualified ? 'Qualified' : 'Not Qualified';
    if (score !== undefined) {
      text += `, score ${score}`;
    }

    this.announce({
      text,
      priority: 'normal',
    });
  }

  /**
   * Announce placement
   */
  public announcePlacement(placement: number, dogName: string): void {
    let ordinal = '';
    switch (placement) {
      case 1:
        ordinal = 'First place';
        break;
      case 2:
        ordinal = 'Second place';
        break;
      case 3:
        ordinal = 'Third place';
        break;
      case 4:
        ordinal = 'Fourth place';
        break;
      default:
        ordinal = `${placement}th place`;
    }

    this.announce({
      text: `${ordinal}, ${dogName}`,
      priority: 'normal',
    });
  }

  /**
   * Announce fault/error
   */
  public announceFault(faultType: string): void {
    this.announce({
      text: faultType,
      priority: 'high',
    });
  }

  /**
   * Announce class complete
   */
  public announceClassComplete(className: string): void {
    this.announce({
      text: `${className} complete`,
      priority: 'normal',
    });
  }

  /**
   * Test voice announcement (for settings)
   */
  public testVoice(text: string = 'This is a test of the voice announcement system'): void {
    this.announce({
      text,
      priority: 'high',
    });
  }
}

// Singleton instance
const voiceAnnouncementService = new VoiceAnnouncementService();

export default voiceAnnouncementService;
