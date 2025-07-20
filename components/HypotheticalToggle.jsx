import React, { useState, useEffect } from 'react';

/**
 * HypotheticalToggle
 * A fixed-position toggle button that enables/disables Hypothetical Mode.
 * In Hypothetical Mode, users can drag pieces freely and draw arrows without affecting actual game state.
 * Provides a global CSS class 'hypothetical-on' on body to allow board overlay handling.
 */
export default function HypotheticalToggle() {
  const [enabled, setEnabled] = useState(false);

  // Add/remove global CSS class to body for styling overlay
  useEffect(() => {
    const body = document.body;
    if (enabled) {
      body.classList.add('hypothetical-on');
    } else {
      body.classList.remove('hypothetical-on');
    }
    return () => {
      body.classList.remove('hypothetical-on');
    };
  }, [enabled]);

  return (
    <button
      onClick={() => setEnabled((prev) => !prev)}
      className={`fixed top-4 right-4 z-50 py-2 px-4 rounded-lg shadow-lg focus:outline-none transition-colors duration-200 
        ${enabled ? 'bg-white text-black' : 'bg-gray-800 text-white'}`}
      title="Toggle Hypothetical Mode (drag pieces & draw arrows)"
    >
      Hypothetical Mode: {enabled ? 'ON' : 'OFF'}
    </button>
  );
}
