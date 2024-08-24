// components/DisplayControls.js
import React from 'react';
import { RefreshCw, Image, Music, PartyPopper, Monitor } from 'lucide-react';

function DisplayControls({ handleSetMode, isDJMode, handleStartDJMode, handleStopDJMode }) {
  return (
    <div className="app-buttons">
      <button onClick={() => handleSetMode('restart')} className="btn btn-red">
        <RefreshCw className="icon" size={20} />
        Restart Display
      </button>
      <button onClick={() => handleSetMode('gallery')} className="btn btn-green">
        <Image className="icon" size={20} />
        Show Gallery
      </button>
      <button onClick={() => handleSetMode('party')} className="btn btn-yellow">
        <PartyPopper className="icon" size={20} />
        Party Mode
      </button>
      <button onClick={() => handleSetMode('black')} className="btn btn-black">
        <Monitor className="icon" size={20} />
        Black mode
      </button>
      <button onClick={isDJMode ? handleStopDJMode : handleStartDJMode} className={`btn ${isDJMode ? 'btn-red' : 'btn-blue'}`}>
        <Music className="icon" size={20} />
        {isDJMode ? 'Stop DJ Mode' : 'Start DJ Mode'}
      </button>
    </div>
  );
}

export default DisplayControls;
