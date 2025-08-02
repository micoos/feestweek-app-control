// components/DJControls.js
import React, { useState, useRef } from 'react';
import { ThumbsUp, PauseCircle, Play, PlayCircle, XCircle } from 'lucide-react';
import config from '../config';
import { ENDPOINTS } from '../constants';

function DJControls({ playlist, currentTrack, playbackState, fetchPlaylist, setResponse }) {
  const [showFullPlaylist, setShowFullPlaylist] = useState(false);
  const promptRef = useRef(null);

  const handlePausePlayback = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/pause_playback`, { method: 'POST' });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(data.message);
        return;
      }
      setResponse('Playback paused');
    } catch (error) {
      setResponse('Failed to pause playback');
    }
    clearResponse();
  };

  const handleResumePlayback = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/resume_playback`, { method: 'POST' });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(data.message);
        return;
      }
      setResponse('Playback resumed');
    } catch (error) {
      setResponse('Failed to resume playback');
    }
    clearResponse();
  };

  const handleAIPrompt = async (e) => {
    const prompt = promptRef.current.value;

    try {
      const response = await fetch(`${config.API_BASE_URL}/ai_playlist_update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(data.message);
        return;
      }
      const data = await response.json();
      setResponse(data.message);
      promptRef.current.value = '';
      fetchPlaylist();
    } catch (error) {
      setResponse('Failed to process AI prompt');
    }
    clearResponse();
  };

  const handleRemoveTrack = async (trackId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/remove_track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: trackId })
      });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(data.message);
        return;
      }
      setResponse('Track removed from playlist');
      fetchPlaylist();
    } catch (error) {
      setResponse('Failed to remove track');
    }
    clearResponse();
  };

  const handlePlayNow = async (trackId) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/play_now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ track_id: trackId })
      });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(data.message);
        return;
      }
      setResponse('Playing requested track now');
    } catch (error) {
      setResponse('Failed to play track');
    }
    clearResponse();
  };

  const setEnergyLevel = async (level) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/set_energy_level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level })
      });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(data.message);
        return;
      }
      setResponse('Energy level set and playing next song');
    } catch (error) {
      setResponse('Failed to set energy level');
    }
    clearResponse();
  };
  const clearResponse = () => {
    setTimeout(() => {
      setResponse('');
    }, 10000);
  };

  return (
    <div className="dj-controls">
      <h3>DJ Controls</h3>
      <input
        type="text"
        placeholder="Enter AI prompt for song suggestion"
        ref={promptRef}
        className="input"
      />
      <button onClick={handleAIPrompt} className="btn btn-green">
        <ThumbsUp className="icon" size={20} />
        Add AI Suggested Song
      </button>
      <div className="dj-buttons">
        <button onClick={handlePausePlayback} className="btn btn-yellow">
          <PauseCircle className="icon" size={20} />
          Pause Playback
        </button>
        <button onClick={handleResumePlayback} className="btn btn-green">
          <Play className="icon" size={20} />
          Resume Playback
        </button>
      </div>
      <div className="dj-buttons">
        <button onClick={() => setEnergyLevel(5)} className="btn btn-orange">
          <Play className="icon" size={20} />
          Set Energy Level & Play Next Song
        </button>
      </div>

      {currentTrack && (
        <div className="current-track">
          <h3>Now Playing</h3>
          <img src={currentTrack.album_image} alt={currentTrack.track_name} />
          <p>{currentTrack.track_name} - {currentTrack.artist_name}</p>
          <p>Danceability: {currentTrack.audio_features.danceability}</p>
          <p>Energy: {currentTrack.audio_features.energy}</p>
          <p>Tempo: {currentTrack.audio_features.tempo}</p>
        </div>
      )}

      {playbackState !== 'playing' && (
        <div className="playback-state">
          <h3>Playback {playbackState}</h3>
        </div>
      )}

      <div className="playlist">
        {!showFullPlaylist && playlist.length > 3 && (
          <button onClick={() => setShowFullPlaylist(true)} className="btn btn-blue">
            Show Full Playlist
          </button>
        )}

        {!showFullPlaylist && playlist.length > 0 && (
          <React.Fragment>
            <h4>Current Playlist</h4>
            <ul>
              {playlist
                .slice(
                  playlist.findIndex(track => track.id === currentTrack?.audio_features?.id) + 1,
                  playlist.findIndex(track => track.id === currentTrack?.audio_features?.id) + 4
                )
                .map((track) => (
                  <li key={track.id} className={`playlist-item ${track.id === currentTrack?.id ? 'current-track' : ''}`}>
                    <span>{track.name} - {track.artist}</span>

                    <button onClick={() => handlePlayNow(track.id)} className="btn btn-blue">
                      <PlayCircle size={20} />
                    </button>
                    <button onClick={() => handleRemoveTrack(track.id)} className="btn btn-red">
                      <XCircle size={20} />
                    </button>

                  </li>
                ))}
            </ul>
          </React.Fragment>
        )}

        {showFullPlaylist && (
          <React.Fragment>
            <button onClick={() => setShowFullPlaylist(false)} className="btn btn-blue">
              Close playlist
            </button>
            <ul>
              {playlist
                .slice(playlist.findIndex(track => track.id === currentTrack?.audio_features?.id) + 4)
                .map((track) => (
                  <li key={track.id} className={`playlist-item ${track.id === currentTrack?.audio_features?.id ? 'current-track' : ''}`}>
                    <span>{track.name} - {track.artist}</span>

                    <button onClick={() => handlePlayNow(track.id)} className="btn btn-blue">
                      <PlayCircle size={20} />
                    </button>
                    <button onClick={() => handleRemoveTrack(track.id)} className="btn btn-red">
                      <XCircle size={20} />
                    </button>

                  </li>
                ))}
            </ul>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

export default DJControls;
