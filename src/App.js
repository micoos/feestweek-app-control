import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import mqtt from 'mqtt/dist/mqtt';
import { RefreshCw, Image, MessageSquare, Link, Music, PartyPopper, Monitor, Youtube, Video, Camera } from 'lucide-react';
import DisplayControls from './components/DisplayControls';
import MessageInput from './components/MessageInput';
import UrlInput from './components/UrlInput';
import DJControls from './components/DJControls';
import YouTubeUrlManager from './components/YouTubeUrlManager';
import ImageManager from './components/ImageManager';
import VideoManager from './components/VideoManager';
import DartScoreboardCapture from './components/DartScoreboardCapture';


const mqttClient = mqtt.connect('ws://swarm2:9001', { clientId: 'control_' + Math.random().toString(16).substr(2, 8) });

function App() {
  const [response, setResponse] = useState('');
  const [playlist, setPlaylist] = useState([]);
  const [isDJMode, setIsDJMode] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playbackState, setPlaybackState] = useState('playing');
  const [showYouTubeManager, setShowYouTubeManager] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [showVideoManager, setShowVideoManager] = useState(false);
  const [showDartScoreboardCapture, setShowDartScoreboardCapture] = useState(false);

  useEffect(() => {
    mqttClient.on('connect', function () {
      setIsConnected(true);
      subscribeToTopics();
    });

    mqttClient.on('close', function () {
      setIsConnected(false);
      console.log('Connection closed. Trying to reconnect...');
    });

    mqttClient.on('message', function (topic, message) {
      if (topic === 'dj/current_track_info') {
        setIsDJMode(true);
        const trackInfo = JSON.parse(message.toString());

        if (trackInfo.state === 'paused' || trackInfo.state === 'stopped') {
          setPlaybackState(trackInfo.state);
        } else {
          setCurrentTrack(trackInfo);
          setPlaybackState('playing');
          fetchPlaylist(); // Fetch the playlist when the current track changes
        }
      }
    });

    //fetchPlaylist();
  }, []);

  useEffect(() => {
    if (currentTrack) {
      fetchPlaylist();
    }
  }, [currentTrack]);

  const subscribeToTopics = () => {
    mqttClient.subscribe('control/action', function (err) {
      if (err) {
        console.error('ACTION subscription error:', err);
      } else {
        console.log('ACTION subscription successful');
      }
    });
    mqttClient.subscribe('dj/playlist', function (err) {
      if (err) {
        console.error('DJ/PLAYLIST subscription error:', err);
      } else {
        console.log('DJ/PLAYLIST subscription successful');
      }
    });
    mqttClient.subscribe('dj/current_track_info', function (err) {
      if (err) {
        console.error('CURRENT_TRACK_INFO subscription error:', err);
      } else {
        console.log('CURRENT_TRACK_INFO subscription successful');
      }
    });
  };

  const fetchPlaylist = async () => {
    try {
      const response = await fetch('http://localhost:8090/get_playlist');
      if (response.status === 401) {
        const data = await response.json();
        window.open(data.auth_url, '_blank');
        return;
      }
      const data = await response.json();
      setPlaylist(data);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
    }
  };

  const handleSetMode = (mode) => {
    mqttClient.publish('control/action', mode);
    setResponse(`Display changed successfully to ${mode}`);
    clearResponse();
  };

  const handleShowMessage = (message) => {
    message = message.replace(/:/g, '');
    mqttClient.publish('control/action', 'message:' + message)
    setResponse(`Message "${message}" shown successfully`);
    clearResponse();
    //messageRef.current.value = '';
  };

  const handleScrapeUrl = (url) => {
    //const url = urlRef.current.value;
    if (url === "") {
      setResponse('No URL given');
      clearResponse();
      return;
    }
    fetch('http://localhost:8090/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
      .then(response => {
        console.log(response);
        setResponse(`Scraped URL "${url}" successfully`);
        clearResponse();
      })
      .catch(error => {
        console.error(error);
        setResponse(`Failed to scrape URL "${url}"`);
        clearResponse();
      });
  };

  const handleStartDJMode = async () => {
    try {
      const response = await fetch('http://localhost:8090/start_dj_mode', { method: 'POST' });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(data.message);
        return;
      }
      setIsDJMode(true);
      setResponse('DJ mode started');
      fetchPlaylist();
    } catch (error) {
      setResponse('Failed to start DJ mode');
    }
    clearResponse();
  };

  const handleStopDJMode = async () => {
    try {
      const response = await fetch('http://localhost:8090/stop_dj_mode', { method: 'POST' });
      if (response.status !== 200) {
        const data = await response.json();
        setResponse(data.message);
        return;
      }
      setIsDJMode(false);
      setResponse('DJ mode stopped');
    } catch (error) {
      setResponse('Failed to stop DJ mode');
    }
    clearResponse();
  };


  const clearResponse = () => {
    setTimeout(() => {
      setResponse('');
    }, 10000);
  };


  const toggleYouTubeManager = () => {
    setShowYouTubeManager(!showYouTubeManager);
  };

  const toggleImageManager = () => {
    setShowImageManager(!showImageManager);
    setShowYouTubeManager(false);
  };

  const toggleVideoManager = () => {
    setShowVideoManager(!showVideoManager);
    setShowYouTubeManager(false);
    setShowImageManager(false);
  };

  const toggleDartScoreboardCapture = () => {
    setShowDartScoreboardCapture(!showDartScoreboardCapture);
    setShowYouTubeManager(false);
    setShowImageManager(false);
    setShowVideoManager(false);
  };

  return (
    <div className="app-container">
      <div className="app-content">
        <div className="app-header">
          <h2>Feestweek Controller</h2>
        </div>
        {!showYouTubeManager && !showImageManager && !showVideoManager && !showDartScoreboardCapture ? (
          <>
            <DisplayControls
              handleSetMode={handleSetMode}
              isDJMode={isDJMode}
              handleStartDJMode={handleStartDJMode}
              handleStopDJMode={handleStopDJMode}
            />
            <MessageInput handleShowMessage={handleShowMessage} />
            <UrlInput handleScrapeUrl={handleScrapeUrl} />
            <button onClick={toggleYouTubeManager} className="btn btn-purple">
              <Youtube className="icon" size={20} />
              Manage YouTube Videos
            </button>
            <button onClick={toggleImageManager} className="btn btn-orange">
              <Image className="icon" size={20} />
              Manage Images
            </button>
            <button onClick={toggleVideoManager} className="btn btn-cyan">
              <Video className="icon" size={20} />
              Manage Videos
            </button>
            <button onClick={toggleDartScoreboardCapture} className="btn btn-indigo">
              <Camera className="icon" size={20} />
              Capture Dart Scoreboard
            </button>
            {response && (
              <div className="response">
                {response}
              </div>
            )}
            {isDJMode && (
              <DJControls
                playlist={playlist}
                currentTrack={currentTrack}
                playbackState={playbackState}
                fetchPlaylist={fetchPlaylist}
                setResponse={setResponse}
              />
            )}
          </>
        ) : showYouTubeManager ? (
          <YouTubeUrlManager mqttClient={mqttClient} onGoBack={toggleYouTubeManager} />
        ) : showImageManager ? (
          <ImageManager mqttClient={mqttClient} onGoBack={toggleImageManager} />
        ) : showVideoManager ? (
          <VideoManager mqttClient={mqttClient} onGoBack={toggleVideoManager} />
        ) : (
          <DartScoreboardCapture mqttClient={mqttClient} onGoBack={toggleDartScoreboardCapture} />
        )}
      </div>
    </div>
  );
}

export default App;