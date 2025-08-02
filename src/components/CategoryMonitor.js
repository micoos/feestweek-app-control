import React, { useState, useEffect } from 'react';
import { Play, StopCircle, RefreshCw, Eye, Clock } from 'lucide-react';
import config from '../config';

function CategoryMonitor({ onGoBack }) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [categoryUrl, setCategoryUrl] = useState('https://www.alteveerkerkenveld.nl/foto-s/feestweken/categories/feestweek-2025');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkStatus();
    // Check status every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/monitor/status`);
      const data = await response.json();
      setStatus(data);
      setIsMonitoring(data.monitoring);
      if (data.category_url) {
        setCategoryUrl(data.category_url);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const startMonitoring = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/monitor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_url: categoryUrl })
      });

      const result = await response.json();
      
      if (response.ok) {
        setIsMonitoring(true);
        checkStatus();
      } else {
        setError(result.error || 'Kon monitoring niet starten');
      }
    } catch (error) {
      setError('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopMonitoring = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/monitor/stop`, {
        method: 'POST'
      });

      if (response.ok) {
        setIsMonitoring(false);
        checkStatus();
      }
    } catch (error) {
      setError('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="category-monitor">
      <div className="manager-header">
        <button onClick={onGoBack} className="btn btn-black">
          ← Terug
        </button>
        <h2>Categorie Monitor</h2>
        <button onClick={checkStatus} className="btn btn-yellow" disabled={isLoading}>
          <RefreshCw className={`icon ${isLoading ? 'spinning' : ''}`} size={20} />
          Ververs
        </button>
      </div>

      <div className="monitor-section">
        <h3>Monitor Instellingen</h3>
        <p className="info-text">
          Monitor een Joomla categorie pagina voor nieuwe foto albums. 
          Nieuwe albums worden automatisch gescraped.
        </p>
        
        <div className="monitor-input">
          <label>Categorie URL:</label>
          <input
            type="text"
            value={categoryUrl}
            onChange={(e) => setCategoryUrl(e.target.value)}
            placeholder="https://www.alteveerkerkenveld.nl/foto-s/feestweken/categories/feestweek-2025"
            className="input"
            disabled={isMonitoring}
          />
        </div>

        <div className="monitor-controls">
          {!isMonitoring ? (
            <button 
              onClick={startMonitoring} 
              className="btn btn-green"
              disabled={isLoading || !categoryUrl}
            >
              <Play className="icon" size={20} />
              Start Monitoring
            </button>
          ) : (
            <button 
              onClick={stopMonitoring} 
              className="btn btn-red"
              disabled={isLoading}
            >
              <StopCircle className="icon" size={20} />
              Stop Monitoring
            </button>
          )}
        </div>

        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>

      {status && (
        <div className="status-section">
          <h3>Monitor Status</h3>
          <div className="status-grid">
            <div className="status-item">
              <Eye className="icon" size={20} />
              <span className="label">Status:</span>
              <span className={`value ${status.monitoring ? 'active' : 'inactive'}`}>
                {status.monitoring ? 'Actief' : 'Inactief'}
              </span>
            </div>
            
            <div className="status-item">
              <Clock className="icon" size={20} />
              <span className="label">Check interval:</span>
              <span className="value">{status.check_interval / 3600} uur</span>
            </div>
            
            <div className="status-item">
              <span className="label">Gescrapete albums:</span>
              <span className="value">{status.scraped_albums}</span>
            </div>
          </div>

          {status.last_albums && status.last_albums.length > 0 && (
            <div className="recent-albums">
              <h4>Recent gescrapete albums:</h4>
              <ul>
                {status.last_albums.map((url, idx) => (
                  <li key={idx}>
                    {url.split('/').pop().replace(/\d{4}$/, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .category-monitor {
          width: 100%;
          padding: 20px;
        }

        .monitor-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .info-text {
          color: #666;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .monitor-input {
          margin-bottom: 20px;
        }

        .monitor-input label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
        }

        .monitor-controls {
          display: flex;
          gap: 10px;
        }

        .status-section {
          background: white;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #e0e0e0;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .status-item .label {
          font-weight: 600;
          margin-right: 5px;
        }

        .status-item .value {
          font-weight: normal;
        }

        .status-item .value.active {
          color: #28a745;
          font-weight: 600;
        }

        .status-item .value.inactive {
          color: #dc3545;
        }

        .recent-albums {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .recent-albums h4 {
          margin-bottom: 10px;
          font-size: 16px;
        }

        .recent-albums ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .recent-albums li {
          padding: 5px 0;
          color: #666;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 5px;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}

export default CategoryMonitor;