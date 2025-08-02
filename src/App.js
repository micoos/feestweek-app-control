import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { RefreshCw, Image, MessageSquare, Link, Music, PartyPopper, Monitor, Youtube, Video, Camera, Keyboard, Calendar, HelpCircle, Settings } from 'lucide-react';

// Components
import DisplayControls from './components/DisplayControls';
import MessageInput from './components/MessageInput';
import UrlInput from './components/UrlInput';
import DJControls from './components/DJControls';
import YouTubeUrlManager from './components/YouTubeUrlManager';
import ImageManager from './components/ImageManager';
import VideoManager from './components/VideoManager';
import DartScoreboardCapture from './components/DartScoreboardCapture';
import ShortcutsHelp from './components/ShortcutsHelp';
import ProgramManager from './components/ProgramManager';
import MessagesManager from './components/MessagesManager';
import AlbumManager from './components/AlbumManager';
import CategoryMonitor from './components/CategoryMonitor';
import QuizControls from './components/QuizControls';
import QuizManager from './components/QuizManager';

// Hooks
import { useSocketConnection, useDJMode, useMediaManagers, useAppState, useKeyboardShortcuts } from './hooks';
import { useApp } from './contexts';

// Constants
import { MEDIA_TYPES } from './constants';

function App() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showQuizControls, setShowQuizControls] = useState(false);
  const [showQuizManager, setShowQuizManager] = useState(false);

  // Socket connection
  const { isConnected, connectedClients, socketClient } = useSocketConnection();

  // App context
  const { showInfo } = useApp();

  // App state
  const {
    response,
    loading,
    currentMode,
    setResponse,
    setCurrentMode,
    sendControlAction,
    sendMessage,
    handleMediaControl
  } = useAppState(socketClient);

  // DJ Mode
  const {
    isDJMode,
    currentTrack,
    playbackState,
    playlist,
    startDJ,
    stopDJ,
    fetchPlaylist
  } = useDJMode(socketClient, setResponse, setCurrentMode);

  // Media managers
  const {
    showYouTubeManager,
    showImageManager,
    showVideoManager,
    showDartScoreboardCapture,
    showProgramManager,
    showMessagesManager,
    showAlbumManager,
    showCategoryMonitor,
    toggleYouTubeManager,
    toggleImageManager,
    toggleVideoManager,
    toggleDartScoreboardCapture,
    toggleProgramManager,
    toggleMessagesManager,
    toggleAlbumManager,
    toggleCategoryMonitor,
    isAnyManagerOpen
  } = useMediaManagers();
  
  // Toggle Quiz Controls
  const toggleQuizControls = useCallback(() => {
    setShowQuizControls(prev => !prev);
  }, []);

  // Auto-show quiz controls when quiz mode is active
  useEffect(() => {
    if (currentMode === 'quiz' && !showQuizControls) {
      setShowQuizControls(true);
    }
  }, [currentMode, showQuizControls]);

  // Toggle DJ mode
  const toggleDJ = useCallback(() => {
    if (isDJMode) {
      stopDJ();
    } else {
      startDJ();
    }
  }, [isDJMode, startDJ, stopDJ]);

  // Show shortcuts help
  const showShortcutsHelp = useCallback(() => {
    setShowShortcuts(true);
    showInfo('Press Esc to close shortcuts help');
  }, [showInfo]);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    sendControlAction,
    toggleYouTubeManager,
    toggleImageManager,
    toggleVideoManager,
    toggleDartScoreboardCapture,
    toggleProgramManager,
    toggleDJ,
    showShortcutsHelp
  }, isAnyManagerOpen);

  // Handle URL submission
  const handleUrlSubmit = (url) => {
    handleMediaControl(MEDIA_TYPES.URL, { url });
  };

  // Filter connected clients by type
  const displayClients = connectedClients?.filter(c => c.type === 'display') || [];
  const controllerClients = connectedClients?.filter(c => c.type === 'control') || [];

  return (
    <div className="App">
      <header className="App-header">
        <h1>Feestweek Control Panel</h1>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● Connected' : '○ Disconnected'}
          </span>
          <div className="client-info">
            <span>Displays: {displayClients.length}</span>
            <span>Controllers: {controllerClients.length}</span>
          </div>
          <button 
            className="shortcuts-button"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts"
          >
            <Keyboard size={20} />
          </button>
        </div>
      </header>

      <div className="container">
        {!isAnyManagerOpen ? (
          <>
            <div className="section">
              <h2>Display Controls</h2>
              <p className="status-text">Current mode: {currentMode}</p>
              <DisplayControls 
                onControlAction={sendControlAction} 
                loading={loading}
                currentMode={currentMode}
              />
              <MessageInput onSendMessage={sendMessage} loading={loading} />
            </div>

            <div className="section media-controls">
              <h2>Media Controls</h2>
              <div className="button-group">
                <button 
                  onClick={toggleYouTubeManager} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Press Y"
                >
                  <Youtube size={20} />
                  YouTube Manager
                </button>
                <button 
                  onClick={toggleImageManager} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Press I"
                >
                  <Image size={20} />
                  Image Manager
                </button>
                <button 
                  onClick={toggleVideoManager} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Press V"
                >
                  <Video size={20} />
                  Video Manager
                </button>
                <button 
                  onClick={toggleDartScoreboardCapture} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Press S"
                >
                  <Camera size={20} />
                  Dart Scoreboard
                </button>
                <button 
                  onClick={toggleProgramManager} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Press P"
                >
                  <Calendar size={20} />
                  Programma Beheer
                </button>
                <button 
                  onClick={toggleMessagesManager} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Beheer berichten"
                >
                  <MessageSquare size={20} />
                  Berichten Beheer
                </button>
                <button 
                  onClick={toggleAlbumManager} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Beheer albums en scrape foto's"
                >
                  <Image size={20} />
                  Album Beheer
                </button>
                <button 
                  onClick={toggleCategoryMonitor} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Monitor categorie voor nieuwe albums"
                >
                  <Monitor size={20} />
                  Categorie Monitor
                </button>
                <button 
                  onClick={toggleQuizControls} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Start een pubquiz"
                >
                  <HelpCircle size={20} />
                  Quiz Control
                </button>
                <button 
                  onClick={() => setShowQuizManager(true)} 
                  className="control-btn media-btn"
                  disabled={loading}
                  title="Beheer quiz vragen"
                >
                  <Settings size={20} />
                  Quiz Beheer
                </button>
              </div>
            </div>

            <div className="section">
              <h2>DJ Mode</h2>
              {isDJMode ? (
                <>
                  <button onClick={stopDJ} className="control-btn stop-btn">
                    Stop DJ Mode
                  </button>
                  <DJControls 
                    playlist={playlist}
                    currentTrack={currentTrack}
                    playbackState={playbackState}
                    fetchPlaylist={fetchPlaylist}
                    setResponse={setResponse}
                  />
                </>
              ) : (
                <button onClick={startDJ} className="control-btn dj-btn" title="Press Ctrl+D">
                  Start DJ Mode
                </button>
              )}
            </div>

            {response && (
              <div className="section response-section">
                <h3>Response:</h3>
                <p className="response-text">{response}</p>
              </div>
            )}
          </>
        ) : (
          <>
            {showYouTubeManager && (
              <YouTubeUrlManager 
                socketClient={socketClient} 
                onGoBack={toggleYouTubeManager} 
              />
            )}
            {showImageManager && (
              <ImageManager 
                socketClient={socketClient} 
                onGoBack={toggleImageManager} 
              />
            )}
            {showVideoManager && (
              <VideoManager 
                socketClient={socketClient} 
                onGoBack={toggleVideoManager} 
              />
            )}
            {showDartScoreboardCapture && (
              <DartScoreboardCapture 
                socketClient={socketClient} 
                onGoBack={toggleDartScoreboardCapture} 
              />
            )}
            {showProgramManager && (
              <ProgramManager 
                socketClient={socketClient} 
                onGoBack={toggleProgramManager} 
              />
            )}
            {showMessagesManager && (
              <MessagesManager 
                socketClient={socketClient} 
                onGoBack={toggleMessagesManager} 
              />
            )}
            {showAlbumManager && (
              <AlbumManager 
                onGoBack={toggleAlbumManager} 
              />
            )}
            {showCategoryMonitor && (
              <CategoryMonitor 
                onGoBack={toggleCategoryMonitor} 
              />
            )}
          </>
        )}
      </div>

      <ShortcutsHelp 
        isOpen={showShortcuts} 
        onClose={() => setShowShortcuts(false)} 
      />
      
      {showQuizControls && (
        <QuizControls
          socketClient={socketClient}
          onClose={() => setShowQuizControls(false)}
        />
      )}
      
      {showQuizManager && (
        <QuizManager
          socketClient={socketClient}
          onClose={() => setShowQuizManager(false)}
        />
      )}
    </div>
  );
}

export default App;