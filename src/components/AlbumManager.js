import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Edit2, Download, RefreshCw, Image, Film, Check, X } from 'lucide-react';
import config from '../config';

function AlbumManager({ onGoBack }) {
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [newAlbumName, setNewAlbumName] = useState('');

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/images`);
      const data = await response.json();
      setAlbums(data.albums || []);
    } catch (error) {
      console.error('Error loading albums:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl) {
      alert('Voer een URL in om te scrapen');
      return;
    }

    setIsScraping(true);
    setScrapeStatus('Scraping gestart in achtergrond...');
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl })
      });

      if (response.ok) {
        const result = await response.json();
        setScrapeStatus('Scraping loopt in achtergrond. Dit kan even duren...');
        
        // Poll for updates every 5 seconds
        const pollInterval = setInterval(async () => {
          await loadAlbums();
        }, 5000);
        
        // Stop polling after 2 minutes
        setTimeout(() => {
          clearInterval(pollInterval);
          setIsScraping(false);
          setScrapeStatus('');
          setScrapeUrl('');
        }, 120000);
      } else {
        const error = await response.json();
        setScrapeStatus(`Error: ${error.error || 'Scraping mislukt'}`);
        setIsScraping(false);
      }
    } catch (error) {
      setScrapeStatus(`Error: ${error.message}`);
      setIsScraping(false);
    }
  };

  const deleteAlbum = async (albumTitle) => {
    if (!window.confirm(`Weet je zeker dat je album "${albumTitle}" wilt verwijderen?`)) {
      return;
    }

    try {
      const response = await fetch(`${config.API_BASE_URL}/albums/${encodeURIComponent(albumTitle)}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadAlbums();
      } else {
        alert('Kon album niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      alert('Error bij verwijderen van album');
    }
  };

  const renameAlbum = async (oldTitle) => {
    if (!newAlbumName.trim()) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/albums/${encodeURIComponent(oldTitle)}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTitle: newAlbumName })
      });

      if (response.ok) {
        setEditingAlbum(null);
        setNewAlbumName('');
        loadAlbums();
      } else {
        alert('Kon album niet hernoemen');
      }
    } catch (error) {
      console.error('Error renaming album:', error);
      alert('Error bij hernoemen van album');
    }
  };

  const getTotalMediaCount = (album) => {
    return (album.images?.length || 0) + (album.videos?.length || 0);
  };

  return (
    <div className="album-manager">
      <div className="manager-header">
        <button onClick={onGoBack} className="btn btn-black">
          <ArrowLeft className="icon" size={20} />
          Terug
        </button>
        <h2>Album Beheer</h2>
      </div>

      <div className="scrape-section">
        <h3>Scrape Nieuwe Foto's</h3>
        <div className="scrape-input">
          <input
            type="text"
            value={scrapeUrl}
            onChange={(e) => setScrapeUrl(e.target.value)}
            placeholder="https://joomla-site.nl/evenement-gallery-url"
            className="input"
            disabled={isScraping}
          />
          <button 
            onClick={handleScrape} 
            className="btn btn-purple"
            disabled={isScraping || !scrapeUrl}
          >
            <Download className="icon" size={20} />
            {isScraping ? 'Bezig...' : 'Scrape'}
          </button>
        </div>
        {scrapeStatus && (
          <div className={`scrape-status ${scrapeStatus.includes('Error') ? 'error' : 'success'}`}>
            {scrapeStatus}
          </div>
        )}
      </div>

      <div className="albums-section">
        <div className="section-header">
          <h3>Albums ({albums.length})</h3>
          <button onClick={loadAlbums} className="btn btn-yellow" disabled={isLoading}>
            <RefreshCw className={`icon ${isLoading ? 'spinning' : ''}`} size={20} />
            Ververs
          </button>
        </div>

        {isLoading ? (
          <div className="loading">Albums laden...</div>
        ) : albums.length === 0 ? (
          <div className="no-albums">Geen albums gevonden. Scrape eerst wat foto's!</div>
        ) : (
          <div className="albums-grid">
            {albums.map((album) => (
              <div key={album.title} className="album-item">
                <div className="album-header">
                  {editingAlbum === album.title ? (
                    <div className="edit-title">
                      <input
                        type="text"
                        value={newAlbumName}
                        onChange={(e) => setNewAlbumName(e.target.value)}
                        placeholder="Nieuwe naam"
                        className="input small"
                        autoFocus
                      />
                      <button 
                        onClick={() => renameAlbum(album.title)}
                        className="btn-icon green"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingAlbum(null);
                          setNewAlbumName('');
                        }}
                        className="btn-icon red"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4>{album.title}</h4>
                      <div className="album-actions">
                        <button 
                          onClick={() => {
                            setEditingAlbum(album.title);
                            setNewAlbumName(album.title);
                          }}
                          className="btn-icon"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => deleteAlbum(album.title)}
                          className="btn-icon red"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="album-info">
                  <div className="media-count">
                    <span>
                      <Image size={16} />
                      {album.images?.length || 0}
                    </span>
                    <span>
                      <Film size={16} />
                      {album.videos?.length || 0}
                    </span>
                  </div>
                  <div className="total-count">
                    Totaal: {getTotalMediaCount(album)} items
                  </div>
                </div>

                {album.images && album.images.length > 0 && (
                  <div className="album-preview">
                    {album.images.slice(0, 4).map((image, idx) => (
                      <img 
                        key={idx}
                        src={`${config.API_BASE_URL}/public/data/${image}`}
                        alt={`Preview ${idx + 1}`}
                        className="preview-thumb"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlbumManager;