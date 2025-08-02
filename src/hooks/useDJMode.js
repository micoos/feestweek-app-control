import { useState, useEffect, useCallback } from 'react';
import { EVENTS, MODES, PLAYBACK_STATES, ENDPOINTS } from '../constants';
import config from '../config';

export const useDJMode = (socketClient, setResponse, setCurrentMode) => {
  const [isDJMode, setIsDJMode] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playbackState, setPlaybackState] = useState(PLAYBACK_STATES.PLAYING);
  const [playlist, setPlaylist] = useState([]);

  useEffect(() => {
    if (!socketClient) return;

    // DJ track updates
    const handleDJTrack = (event, trackInfo) => {
      console.log('DJ track update:', trackInfo);
      
      if (!trackInfo) {
        console.warn('Received empty track info');
        return;
      }
      
      setIsDJMode(true);
      
      if (trackInfo.state === PLAYBACK_STATES.PAUSED || trackInfo.state === PLAYBACK_STATES.STOPPED) {
        setPlaybackState(trackInfo.state);
        if (trackInfo.state === PLAYBACK_STATES.STOPPED) {
          setIsDJMode(false);
        }
      } else {
        setCurrentTrack(trackInfo);
        setPlaybackState(PLAYBACK_STATES.PLAYING);
      }
    };

    // Playlist updates
    const handleDJPlaylist = (event, playlist) => {
      console.log('DJ playlist update:', playlist);
      setPlaylist(playlist);
    };

    // Energy level updates
    const handleDJEnergy = (event, data) => {
      console.log('DJ energy level update:', data.level);
    };

    socketClient.on(EVENTS.DJ_TRACK, handleDJTrack);
    socketClient.on(EVENTS.DJ_PLAYLIST, handleDJPlaylist);
    socketClient.on(EVENTS.DJ_ENERGY, handleDJEnergy);

    return () => {
      socketClient.off(EVENTS.DJ_TRACK);
      socketClient.off(EVENTS.DJ_PLAYLIST);
      socketClient.off(EVENTS.DJ_ENERGY);
    };
  }, [socketClient]);

  // Fetch playlist when track changes
  useEffect(() => {
    if (currentTrack) {
      fetchPlaylist();
    }
  }, [currentTrack]);

  const fetchPlaylist = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}${ENDPOINTS.GET_PLAYLIST}`);
      if (response.status === 401) {
        console.log('Spotify not authenticated');
        setPlaylist([]);
        return;
      }
      const data = await response.json();
      setPlaylist(data.playlist || []);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      setPlaylist([]);
    }
  }, []);

  const startDJ = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}${ENDPOINTS.START_DJ_MODE}`, { 
        method: 'POST' 
      });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(`Error: ${data.error || 'Unknown error'}`);
      } else {
        setResponse('DJ mode started successfully');
        socketClient.emit(EVENTS.CONTROL_ACTION, { action: MODES.DJ }, (response) => {
          if (response && response.success) {
            setCurrentMode(MODES.DJ);
          }
        });
      }
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    }
  }, [socketClient, setResponse, setCurrentMode]);

  const stopDJ = useCallback(async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}${ENDPOINTS.STOP_DJ_MODE}`, { 
        method: 'POST' 
      });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(`Error: ${data.error || 'Unknown error'}`);
      } else {
        setResponse('DJ mode stopped successfully');
        socketClient.emit(EVENTS.CONTROL_ACTION, { action: MODES.GALLERY }, (response) => {
          if (response && response.success) {
            setCurrentMode(MODES.GALLERY);
          }
        });
      }
    } catch (error) {
      setResponse(`Error: ${error.message}`);
    }
  }, [socketClient, setResponse, setCurrentMode]);

  return {
    isDJMode,
    currentTrack,
    playbackState,
    playlist,
    startDJ,
    stopDJ,
    fetchPlaylist
  };
};