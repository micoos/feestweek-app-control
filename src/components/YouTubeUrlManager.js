// components/YouTubeUrlManager.js
import React, { useState, useEffect } from 'react';
import { Plus, Send, Trash2, ArrowLeft, Clock } from 'lucide-react';

function YouTubeUrlManager({ socketClient, onGoBack }) {
  const [videos, setVideos] = useState([]);
  const [newUrl, setNewUrl] = useState('');
  const [startMinutes, setStartMinutes] = useState('');
  const [startSeconds, setStartSeconds] = useState('');
  const [endMinutes, setEndMinutes] = useState('');
  const [endSeconds, setEndSeconds] = useState('');

  useEffect(() => {
    const storedVideos = JSON.parse(localStorage.getItem('youtubeVideos')) || [];
    setVideos(storedVideos);
  }, []);

  const saveVideos = (updatedVideos) => {
    localStorage.setItem('youtubeVideos', JSON.stringify(updatedVideos));
    setVideos(updatedVideos);
  };

  const addVideo = () => {
    if (newUrl && isValidYouTubeUrl(newUrl)) {
      const newVideo = {
        url: newUrl,
        startTime: timeToSeconds(startMinutes, startSeconds),
        endTime: timeToSeconds(endMinutes, endSeconds)
      };
      const updatedVideos = [...videos, newVideo];
      saveVideos(updatedVideos);
      setNewUrl('');
      setStartMinutes('');
      setStartSeconds('');
      setEndMinutes('');
      setEndSeconds('');
    } else {
      alert('Please enter a valid YouTube URL');
    }
  };

  const removeVideo = (videoToRemove) => {
    const updatedVideos = videos.filter(video => video.url !== videoToRemove.url);
    saveVideos(updatedVideos);
  };

  const sendVideoId = (video) => {
    const videoId = extractVideoId(video.url);
    if (videoId) {
      const payload = {
        videoId,
        startTime: video.startTime,
        endTime: video.endTime
      };
      socketClient.emit('control_media', { 
        type: 'youtube', 
        data: payload 
      });
    }
  };

  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getThumbnailUrl = (url) => {
    const videoId = extractVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : '';
  };

  const timeToSeconds = (minutes, seconds) => {
    const mins = parseInt(minutes) || 0;
    const secs = parseInt(seconds) || 0;
    return mins * 60 + secs;
  };

  const formatTime = (totalSeconds) => {
    if (totalSeconds === null || totalSeconds === undefined) return '';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="youtube-url-manager">
      <div className="youtube-header">
        <button onClick={onGoBack} className="btn btn-blue go-back-btn">
          <ArrowLeft className="icon" size={20} />
          Go Back
        </button>
        <h3>YouTube Video Manager</h3>
      </div>
      <div className="url-input">
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          className="input"
        />
        <div className="time-inputs">
          <div className="time-input-group">
            <input
              type="number"
              value={startMinutes}
              onChange={(e) => setStartMinutes(e.target.value)}
              placeholder="Start Min"
              className="input time-input"
              min="0"
            />
            <input
              type="number"
              value={startSeconds}
              onChange={(e) => setStartSeconds(e.target.value)}
              placeholder="Start Sec"
              className="input time-input"
              min="0"
              max="59"
            />
          </div>
          <div className="time-input-group">
            <input
              type="number"
              value={endMinutes}
              onChange={(e) => setEndMinutes(e.target.value)}
              placeholder="End Min"
              className="input time-input"
              min="0"
            />
            <input
              type="number"
              value={endSeconds}
              onChange={(e) => setEndSeconds(e.target.value)}
              placeholder="End Sec"
              className="input time-input"
              min="0"
              max="59"
            />
          </div>
        </div>
        <button onClick={addVideo} className="btn btn-blue">
          <Plus className="icon" size={20} />
          Add Video
        </button>
      </div>
      <div className="url-list">
        {videos.map((video, index) => (
          <div key={index} className="url-item">
            <img src={getThumbnailUrl(video.url)} alt="Video thumbnail" className="thumbnail" />
            <div className="video-info">
              {video.startTime !== null && (
                <span className="time-info">
                  <Clock className="icon" size={16} />
                  Start: {formatTime(video.startTime)}
                </span>
              )}
              {video.endTime !== null && (
                <span className="time-info">
                  <Clock className="icon" size={16} />
                  End: {formatTime(video.endTime)}
                </span>
              )}
            </div>
            <div className="url-actions">
              <button onClick={() => sendVideoId(video)} className="btn btn-green">
                <Send className="icon" size={20} />
                Send
              </button>
              <button onClick={() => removeVideo(video)} className="btn btn-red">
                <Trash2 className="icon" size={20} />
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default YouTubeUrlManager;