'use client';
import React from 'react';
import { Button } from '../ui/button';
import { useStore } from '@/common/store/store';

const ToggleShowPinnedMarkerButton = () => {
  const { showPinnedMarker, updateShowPinnedMarker } = useStore();
  return (
    <>
      {showPinnedMarker ? (
        <Button
          variant='destructive'
          onClick={() => updateShowPinnedMarker(!showPinnedMarker)}
        >
          Pinned
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => updateShowPinnedMarker(!showPinnedMarker)}
        >
          Pinned
        </Button>
      )}
    </>
  );
};

export default ToggleShowPinnedMarkerButton;
