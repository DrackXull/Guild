
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Defines the sound files and their friendly names.
const soundFiles = {
  confirm: '/sounds/chest-unlock.mp3', // Primary action
  switch: '/sounds/rock-slide.mp3',   // Toggle/switch
  error: '/sounds/ui-error.mp3',      // Error
  success: '/sounds/ui-success.mp3',  // Success
  typing: '/sounds/quill-writing.mp3',  // Typing
  hover: '/sounds/ui-hover.mp3'       // Button hover
};

export type SoundName = keyof typeof soundFiles;

// Singleton AudioContext to avoid creating multiple instances.
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (typeof window !== 'undefined' && !audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Cache for storing pre-loaded audio buffers.
const audioBufferCache: Map<SoundName, AudioBuffer> = new Map();

// A map to keep track of the last time a sound was played.
const soundTimestamps: Map<SoundName, number> = new Map();
const TYPING_THROTTLE_MS = 100;


/**
 * Custom hook to manage and play audio using the Web Audio API.
 * It preloads sounds and provides a function to play them.
 */
export function useAudio() {
  const [isLoaded, setIsLoaded] = useState(false);
  const context = useRef(getAudioContext());

  // Preload all sounds on component mount.
  useEffect(() => {
    const loadSounds = async () => {
      const currentContext = context.current;
      if (!currentContext) return;

      const promises = Object.entries(soundFiles).map(async ([name, path]) => {
        if (audioBufferCache.has(name as SoundName)) {
          return;
        }
        try {
          const response = await fetch(path);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await currentContext.decodeAudioData(arrayBuffer);
          audioBufferCache.set(name as SoundName, audioBuffer);
        } catch (error) {
          console.error(`Failed to load sound: ${name}`, error);
        }
      });

      await Promise.all(promises);
      setIsLoaded(true);
    };

    loadSounds();
  }, []);

  /**
   * Plays a pre-loaded sound with optional throttling.
   * @param soundName The friendly name of the sound to play.
   */
  const playSound = useCallback((soundName: SoundName) => {
    const currentContext = context.current;
    if (!isLoaded || !currentContext) return;
    
    // Throttle typing sound
    if (soundName === 'typing') {
      const now = Date.now();
      const lastPlayed = soundTimestamps.get('typing') || 0;
      if (now - lastPlayed < TYPING_THROTTLE_MS) {
        return;
      }
      soundTimestamps.set('typing', now);
    }
    
    // Resume context if it's suspended (required for autoplay policy in browsers)
    if (currentContext.state === 'suspended') {
      currentContext.resume();
    }

    const audioBuffer = audioBufferCache.get(soundName);
    if (audioBuffer) {
      const source = currentContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(currentContext.destination);
      source.start(0);
    }
  }, [isLoaded]);

  return { playSound, isLoaded };
}
