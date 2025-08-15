'use client';

import { useEffect, useState } from 'react';

export default function FreeConversation() {
  const [isOpen, setIsOpen] = useState(false);

  // Listen open/close events from other components
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    window.addEventListener('openMindmapOverlay', handleOpen as EventListener);
    window.addEventListener(
      'closeMindmapOverlay',
      handleClose as EventListener,
    );

    return () => {
      window.removeEventListener(
        'openMindmapOverlay',
        handleOpen as EventListener,
      );
      window.removeEventListener(
        'closeMindmapOverlay',
        handleClose as EventListener,
      );
    };
  }, []);

  // Broadcast state so other UI (e.g. toolbar) can react
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent('mindmapOverlayState', { detail: { open: isOpen } }),
      );
    } catch (e) {
      // noop
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="relative w-full h-full">
      {/* Other free conversation UI goes here */}
      <div className="absolute inset-0 z-40 bg-white backdrop-blur-md"></div>
    </div>
  );
}
