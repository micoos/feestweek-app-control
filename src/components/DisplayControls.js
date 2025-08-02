// components/DisplayControls.js
import React from 'react';
import { RefreshCw, Image, Music, PartyPopper, Monitor, HelpCircle } from 'lucide-react';

function DisplayControls({ onControlAction, loading, currentMode }) {
  return (
    <div className="app-buttons">
      <button onClick={() => onControlAction('restart')} className="btn btn-red" disabled={loading}>
        <RefreshCw className="icon" size={20} />
        Restart Display
      </button>
      <button onClick={() => onControlAction('gallery')} className="btn btn-green" disabled={loading}>
        <Image className="icon" size={20} />
        Show Gallery
      </button>
      <button onClick={() => onControlAction('party')} className="btn btn-yellow" disabled={loading}>
        <PartyPopper className="icon" size={20} />
        Party Mode
      </button>
      <button onClick={() => onControlAction('black')} className="btn btn-black" disabled={loading}>
        <Monitor className="icon" size={20} />
        Black mode
      </button>
      <button onClick={() => onControlAction('quiz')} className="btn btn-blue" disabled={loading}>
        <HelpCircle className="icon" size={20} />
        Quiz Mode
      </button>
    </div>
  );
}

export default DisplayControls;
