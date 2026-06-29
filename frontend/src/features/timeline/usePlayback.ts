import { useCallback } from 'react';
import { usePlaybackStore } from '@/stores/playbackStore';

export function usePlayback() {
  const { isPlaying, playSequence, stopSequence } = usePlaybackStore();

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopSequence();
    } else {
      playSequence();
    }
  }, [isPlaying, playSequence, stopSequence]);

  const stopPlayback = useCallback(() => {
    stopSequence();
  }, [stopSequence]);

  return { togglePlayback, stopPlayback, isPlaying };
}
