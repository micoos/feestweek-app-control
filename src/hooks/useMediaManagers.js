import { useState, useCallback } from 'react';

export const useMediaManagers = () => {
  const [showYouTubeManager, setShowYouTubeManager] = useState(false);
  const [showImageManager, setShowImageManager] = useState(false);
  const [showVideoManager, setShowVideoManager] = useState(false);
  const [showDartScoreboardCapture, setShowDartScoreboardCapture] = useState(false);
  const [showProgramManager, setShowProgramManager] = useState(false);
  const [showMessagesManager, setShowMessagesManager] = useState(false);
  const [showAlbumManager, setShowAlbumManager] = useState(false);
  const [showCategoryMonitor, setShowCategoryMonitor] = useState(false);

  const toggleYouTubeManager = useCallback(() => {
    setShowYouTubeManager(prev => !prev);
  }, []);

  const toggleImageManager = useCallback(() => {
    setShowImageManager(prev => !prev);
  }, []);

  const toggleVideoManager = useCallback(() => {
    setShowVideoManager(prev => !prev);
  }, []);

  const toggleDartScoreboardCapture = useCallback(() => {
    setShowDartScoreboardCapture(prev => !prev);
  }, []);

  const toggleProgramManager = useCallback(() => {
    setShowProgramManager(prev => !prev);
  }, []);

  const toggleMessagesManager = useCallback(() => {
    setShowMessagesManager(prev => !prev);
  }, []);

  const toggleAlbumManager = useCallback(() => {
    setShowAlbumManager(prev => !prev);
  }, []);
  
  const toggleCategoryMonitor = useCallback(() => {
    setShowCategoryMonitor(prev => !prev);
  }, []);

  const isAnyManagerOpen = showYouTubeManager || showImageManager || 
                          showVideoManager || showDartScoreboardCapture ||
                          showProgramManager || showMessagesManager ||
                          showAlbumManager || showCategoryMonitor;

  return {
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
  };
};