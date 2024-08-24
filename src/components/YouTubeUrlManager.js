// components/YouTubeUrlManager.js
import React, { useState, useEffect } from 'react';
import { Plus, Send, Trash2 } from 'lucide-react';

function YouTubeURLManager({ mqttClient }) {
  const [urls, setUrls] = useState([]);
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    const storedUrls = JSON.parse(localStorage.getItem('youtubeUrls')) || [];
    setUrls(storedUrls);
  }, []);

  const saveUrls = (updatedUrls) => {
    localStorage.setItem('youtubeUrls', JSON.stringify(updatedUrls));
    setUrls(updatedUrls);
  };

  const addUrl = () => {
    if (newUrl && isValidYouTubeUrl(newUrl)) {
      const updatedUrls = [...urls, newUrl];
      saveUrls(updatedUrls);
      setNewUrl('');
    } else {
      alert('Please enter a valid YouTube URL');
    }
  };

  const removeUrl = (urlToRemove) => {
    const updatedUrls = urls.filter(url => url !== urlToRemove);
    saveUrls(updatedUrls);
  };

  const sendVideoId = (url) => {
    const videoId = extractVideoId(url);
    if (videoId) {
      mqttClient.publish('control/youtube', videoId);
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

  return (
    <div className="youtube-url-manager">
      <h3>YouTube Video Manager</h3>
      <div className="url-input">
        <input
          type="text"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          className="input"
        />
        <button onClick={addUrl} className="btn btn-blue">
          <Plus className="icon" size={20} />
          Add URL
        </button>
      </div>
      <div className="url-list">
        {urls.map((url, index) => (
          <div key={index} className="url-item">
            <img src={getThumbnailUrl(url)} alt="Video thumbnail" className="thumbnail" />
            <div className="url-actions">
              <button onClick={() => sendVideoId(url)} className="btn btn-green">
                <Send className="icon" size={20} />
                Send
              </button>
              <button onClick={() => removeUrl(url)} className="btn btn-red">
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

export default YouTubeURLManager;