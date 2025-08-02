// components/VideoManager.js
import React, { useState, useEffect } from 'react';
import { Upload, Send, Trash2, ArrowLeft, Video } from 'lucide-react';
import config from '../config';

// IndexedDB helper functions (similar to ImageManager)
const dbName = 'VideoStore';
const storeName = 'videos';

const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            db.createObjectStore(storeName, { keyPath: 'id' });
        };
    });
};

const addVideo = async (video) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(video);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

const getAllVideos = async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

const deleteVideo = async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
};

function VideoManager({ socketClient, onGoBack }) {
    const [videos, setVideos] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
  
    useEffect(() => {
      loadVideos();
    }, []);
  
    const loadVideos = async () => {
      try {
        const loadedVideos = await getAllVideos();
        setVideos(loadedVideos);
      } catch (error) {
        console.error('Error loading videos:', error);
      }
    };
  
    const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (file && file.type === 'video/mp4') {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('video', file);
  
          const response = await fetch(`${config.API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
          });
  
          if (!response.ok) {
            throw new Error('Failed to upload video');
          }
  
          const result = await response.json();
  
          const newVideo = {
            id: Date.now(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: `${config.API_BASE_URL}${result.url}`
          };
  
          await addVideo(newVideo);
          loadVideos();
        } catch (error) {
          console.error('Error uploading video:', error);
          alert('Failed to upload video. Please try again.');
        } finally {
          setIsUploading(false);
        }
      } else {
        alert('Please select an MP4 video file.');
      }
    };
  
    const removeVideo = async (videoToRemove) => {
      try {
        // First, delete from server
        const response = await fetch(`${config.API_BASE_URL}/delete${new URL(videoToRemove.url).pathname}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          throw new Error('Failed to delete video from server');
        }
  
        // Then, delete from local storage
        await deleteVideo(videoToRemove.id);
        loadVideos();
      } catch (error) {
        console.error('Error removing video:', error);
        alert('Failed to remove video. Please try again.');
      }
    };
  
    const sendVideo = (video) => {
      socketClient.emit('control_media', { 
        type: 'video', 
        data: {
          id: video.id,
          name: video.name,
          url: video.url
        }
      });
    };
  
    return (
      <div className="video-manager">
            <div className="video-header">
                <button onClick={onGoBack} className="btn btn-blue go-back-btn">
                    <ArrowLeft className="icon" size={20} />
                    Go Back
                </button>
                <h3>Video Manager</h3>
            </div>
            <div className="video-inputs">
                <input
                    type="file"
                    accept="video/mp4"
                    onChange={handleFileUpload}
                    className="file-input"
                    id="video-upload"
                    disabled={isUploading}
                />
                <label htmlFor="video-upload" className={`btn btn-blue ${isUploading ? 'disabled' : ''}`}>
                    <Upload className="icon" size={20} />
                    {isUploading ? 'Uploading...' : 'Upload Video'}
                </label>
            </div>
            <div className="video-list">
                {videos.map((video) => (
                    <div key={video.id} className="video-item">
                        <Video className="video-icon" size={48} />
                        <div className="video-info">
                            <p>{video.name}</p>
                            <p>{(video.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="video-actions">
                            <button onClick={() => sendVideo(video)} className="btn btn-green">
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

export default VideoManager;