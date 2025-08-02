import React, { useState, useEffect, useCallback } from 'react';
import { Save, Download, Upload, AlertCircle, CheckCircle, FileJson, Search, Play, Pause, Eye, Plus, Trash2, Copy, Edit3 } from 'lucide-react';
import './QuizManager.css';

const QuizManager = ({ socketClient, onClose }) => {
  const [jsonContent, setJsonContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [spotifySearch, setSpotifySearch] = useState('');
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(null);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' or 'json'
  const [parsedData, setParsedData] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [editingRound, setEditingRound] = useState(null);

  // Round type templates
  const roundTemplates = {
    question: {
      title: "Nieuwe vragenronde",
      type: "question",
      round: "1",
      background: "/quiz-assets/background/algemeen.jpg",
      questions: [
        { text: "Vraag 1?", answer: "Antwoord 1" }
      ]
    },
    music: {
      title: "Muziekronde",
      type: "music",
      round: "1",
      background: "/quiz-assets/background/muziek.jpg",
      questions: [
        {
          text: "Van welke artiest is dit nummer?",
          answer: "Artiest naam",
          spotify: {
            track_id: "spotify:track:xxxxx",
            start_position: 30,
            duration: 30
          }
        }
      ]
    },
    clips: {
      title: "Video clips ronde",
      type: "clips",
      background: "/quiz-assets/background/clips.jpg",
      questions: [
        { videoId: "YouTube_ID", start: 0, end: 30, answer: "Antwoord" }
      ]
    },
    photo: {
      title: "Foto ronde",
      type: "photo",
      round: "1",
      background: "/quiz-assets/background/foto.jpg",
      questions: [
        { url: "/quiz-assets/foto.jpg", answer: "Antwoord" }
      ]
    }
  };

  // Load current quiz JSON
  useEffect(() => {
    loadQuizData();
  }, []);

  const loadQuizData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8090/api/quiz/json');
      if (!response.ok) throw new Error('Failed to load quiz data');
      
      const data = await response.json();
      const formatted = JSON.stringify(data, null, 2);
      setJsonContent(formatted);
      setOriginalContent(formatted);
      setParsedData(data);
      setError(null);
    } catch (err) {
      setError('Error loading quiz data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Track changes
  useEffect(() => {
    setIsDirty(jsonContent !== originalContent);
  }, [jsonContent, originalContent]);

  // Update parsed data when JSON changes
  useEffect(() => {
    if (activeTab === 'json') {
      try {
        const parsed = JSON.parse(jsonContent);
        setParsedData(parsed);
        setError(null);
      } catch (err) {
        // Don't show error while typing
      }
    }
  }, [jsonContent, activeTab]);

  const validateJSON = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonContent);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Root must be an array');
      }
      
      parsed.forEach((round, index) => {
        if (!round.title) {
          throw new Error(`Round ${index + 1} missing title`);
        }
        if (!round.type) {
          throw new Error(`Round ${index + 1} missing type`);
        }
      });
      
      return { valid: true, data: parsed };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }, [jsonContent]);

  const handleSave = async () => {
    const validation = validateJSON();
    if (!validation.valid) {
      setError('Invalid JSON: ' + validation.error);
      return;
    }

    try {
      const response = await fetch('http://localhost:8090/api/quiz/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonContent
      });

      if (!response.ok) throw new Error('Failed to save quiz data');
      
      setOriginalContent(jsonContent);
      setSuccess('Quiz data saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      if (socketClient) {
        socketClient.emit('quiz:reload');
      }
    } catch (err) {
      setError('Error saving quiz data: ' + err.message);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const parsed = JSON.parse(content);
        setJsonContent(JSON.stringify(parsed, null, 2));
        setParsedData(parsed);
        setSuccess('File uploaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Invalid JSON file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const addRound = (type) => {
    const newRound = { ...roundTemplates[type] };
    newRound.round = String(parsedData.length + 1);
    
    const updatedData = [...parsedData, newRound];
    setParsedData(updatedData);
    setJsonContent(JSON.stringify(updatedData, null, 2));
    setEditingRound(updatedData.length - 1);
  };

  const deleteRound = (index) => {
    if (window.confirm('Weet je zeker dat je deze ronde wilt verwijderen?')) {
      const updatedData = parsedData.filter((_, i) => i !== index);
      setParsedData(updatedData);
      setJsonContent(JSON.stringify(updatedData, null, 2));
    }
  };

  const updateRound = (index, updates) => {
    const updatedData = [...parsedData];
    updatedData[index] = { ...updatedData[index], ...updates };
    setParsedData(updatedData);
    setJsonContent(JSON.stringify(updatedData, null, 2));
  };

  const addQuestion = (roundIndex) => {
    const round = parsedData[roundIndex];
    if (!round.questions) round.questions = [];
    
    let newQuestion;
    switch (round.type) {
      case 'music':
        newQuestion = {
          text: "Nieuwe muziekvraag",
          answer: "Antwoord",
          spotify: { track_id: "", start_position: 30, duration: 30 }
        };
        break;
      case 'clips':
        newQuestion = { videoId: "", start: 0, end: 30, answer: "Antwoord" };
        break;
      case 'photo':
        newQuestion = { url: "/quiz-assets/", answer: "Antwoord" };
        break;
      default:
        newQuestion = { text: "Nieuwe vraag", answer: "Antwoord" };
    }
    
    const updatedData = [...parsedData];
    updatedData[roundIndex].questions.push(newQuestion);
    setParsedData(updatedData);
    setJsonContent(JSON.stringify(updatedData, null, 2));
  };

  const deleteQuestion = (roundIndex, questionIndex) => {
    const updatedData = [...parsedData];
    updatedData[roundIndex].questions.splice(questionIndex, 1);
    setParsedData(updatedData);
    setJsonContent(JSON.stringify(updatedData, null, 2));
  };

  const searchSpotify = async () => {
    if (!spotifySearch.trim()) return;

    try {
      console.log('Searching Spotify for:', spotifySearch);
      console.log('Active question index:', activeQuestionIndex);
      const response = await fetch(`http://localhost:8090/api/spotify/search?q=${encodeURIComponent(spotifySearch)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      console.log('Spotify results:', data);
      console.log('Number of tracks:', data.tracks?.length || 0);
      setSpotifyResults(data.tracks || []);
    } catch (err) {
      setError('Spotify search failed: ' + err.message);
      console.error('Spotify search error:', err);
    }
  };

  const insertSpotifyTrack = (track, roundIndex, questionIndex) => {
    const updatedData = [...parsedData];
    const question = updatedData[roundIndex].questions[questionIndex];
    
    question.answer = track.artists[0].name;
    question.spotify = {
      track_id: track.uri,
      start_position: 30,
      duration: 30
    };
    
    setParsedData(updatedData);
    setJsonContent(JSON.stringify(updatedData, null, 2));
    setSpotifyResults([]);
    setSpotifySearch('');
  };

  const previewTrack = async (track) => {
    if (socketClient) {
      socketClient.emit('spotify:control', {
        command: 'play_track',
        track_id: track.uri,
        position_ms: 30000
      });
      
      setTimeout(() => {
        socketClient.emit('spotify:control', { command: 'pause' });
      }, 5000);
    }
  };

  return (
    <div className="quiz-manager-modal">
      <div className="quiz-manager">
        <div className="quiz-manager-header">
          <h2><FileJson size={24} /> Quiz Manager</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        <div className="quiz-manager-tabs">
          <button 
            className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
            onClick={() => setActiveTab('visual')}
          >
            <Eye size={18} />
            Visual Editor
          </button>
          <button 
            className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => setActiveTab('json')}
          >
            <FileJson size={18} />
            JSON Editor
          </button>
        </div>

        <div className="quiz-manager-toolbar">
          <button 
            onClick={handleSave} 
            className="toolbar-btn primary"
            disabled={!isDirty || isLoading}
          >
            <Save size={18} />
            Save Changes
          </button>
          
          <button 
            onClick={handleDownload} 
            className="toolbar-btn"
          >
            <Download size={18} />
            Download
          </button>
          
          <label className="toolbar-btn">
            <Upload size={18} />
            Upload
            <input 
              type="file" 
              accept=".json"
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </label>

          {isDirty && (
            <span className="status-indicator">Unsaved changes</span>
          )}
        </div>

        <div className="quiz-manager-content">
          {activeTab === 'visual' ? (
            <div className="visual-editor">
              <div className="rounds-list">
                <div className="rounds-header">
                  <h3>Quiz Rondes</h3>
                  <div className="add-round-buttons">
                    <button 
                      onClick={() => addRound('question')} 
                      className="add-btn"
                      title="Vragenronde"
                    >
                      <Plus size={16} /> Vragen
                    </button>
                    <button 
                      onClick={() => addRound('music')} 
                      className="add-btn"
                      title="Muziekronde"
                    >
                      <Plus size={16} /> Muziek
                    </button>
                    <button 
                      onClick={() => addRound('clips')} 
                      className="add-btn"
                      title="Videoronde"
                    >
                      <Plus size={16} /> Video
                    </button>
                    <button 
                      onClick={() => addRound('photo')} 
                      className="add-btn"
                      title="Fotoronde"
                    >
                      <Plus size={16} /> Foto
                    </button>
                  </div>
                </div>
                
                {parsedData.map((round, index) => (
                  <div 
                    key={index} 
                    className={`round-item ${selectedRound === index ? 'selected' : ''}`}
                    onClick={() => setSelectedRound(index)}
                  >
                    <div className="round-header">
                      <span className="round-number">{index + 1}</span>
                      <span className="round-title">{round.title}</span>
                      <span className="round-type">{round.type}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRound(index);
                        }}
                        className="delete-btn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="round-editor">
                {selectedRound !== null && parsedData[selectedRound] && (
                  <>
                    <div className="round-details">
                      <h3>Ronde Details</h3>
                      <div className="form-group">
                        <label>Titel</label>
                        <input 
                          type="text"
                          value={parsedData[selectedRound].title}
                          onChange={(e) => updateRound(selectedRound, { title: e.target.value })}
                        />
                      </div>
                      
                      {parsedData[selectedRound].background && (
                        <div className="form-group">
                          <label>Achtergrond</label>
                          <input 
                            type="text"
                            value={parsedData[selectedRound].background}
                            onChange={(e) => updateRound(selectedRound, { background: e.target.value })}
                          />
                        </div>
                      )}
                    </div>

                    {parsedData[selectedRound].questions && (
                      <div className="questions-section">
                        <div className="questions-header">
                          <h3>Vragen</h3>
                          <button 
                            onClick={() => addQuestion(selectedRound)}
                            className="add-btn"
                          >
                            <Plus size={16} /> Vraag toevoegen
                          </button>
                        </div>
                        
                        {parsedData[selectedRound].questions.map((question, qIndex) => (
                          <div key={qIndex} className="question-item">
                            <div className="question-number">{qIndex + 1}</div>
                            <div className="question-content">
                              {parsedData[selectedRound].type === 'music' && (
                                <>
                                  <input 
                                    type="text"
                                    placeholder="Vraag"
                                    value={question.text}
                                    onChange={(e) => {
                                      const updated = [...parsedData];
                                      updated[selectedRound].questions[qIndex].text = e.target.value;
                                      setParsedData(updated);
                                      setJsonContent(JSON.stringify(updated, null, 2));
                                    }}
                                  />
                                  
                                  <div className="spotify-controls">
                                    <div className="spotify-search-row">
                                      <input 
                                        type="text"
                                        placeholder="Zoek een nummer op Spotify..."
                                        value={activeQuestionIndex === qIndex ? spotifySearch : ''}
                                        onChange={(e) => {
                                          setSpotifySearch(e.target.value);
                                          setActiveQuestionIndex(qIndex);
                                        }}
                                        onFocus={() => setActiveQuestionIndex(qIndex)}
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            searchSpotify();
                                          }
                                        }}
                                      />
                                      <button 
                                        onClick={() => {
                                          setActiveQuestionIndex(qIndex);
                                          searchSpotify();
                                        }} 
                                        className="search-btn"
                                      >
                                        <Search size={16} />
                                      </button>
                                    </div>
                                    
                                    {activeQuestionIndex === qIndex && spotifyResults.length > 0 && (
                                      <div className="spotify-dropdown" style={{ position: 'relative', zIndex: 1000 }}>
                                        <div style={{ padding: '0.5rem', color: '#999', fontSize: '0.75rem' }}>
                                          {spotifyResults.length} resultaten gevonden
                                        </div>
                                        {spotifyResults.map((track) => (
                                          <div key={track.id} className="spotify-result">
                                            <div className="track-info">
                                              <strong>{track.name}</strong>
                                              <span>{track.artists.map(a => a.name).join(', ')}</span>
                                              <code>{track.uri}</code>
                                            </div>
                                            <button 
                                              onClick={() => {
                                                insertSpotifyTrack(track, selectedRound, qIndex);
                                                setSpotifyResults([]);
                                                setSpotifySearch('');
                                                setActiveQuestionIndex(null);
                                              }}
                                              className="select-btn"
                                            >
                                              Selecteer
                                            </button>
                                          </div>
                                        ))}
                                        <button 
                                          onClick={() => {
                                            setSpotifyResults([]);
                                            setSpotifySearch('');
                                            setActiveQuestionIndex(null);
                                          }}
                                          className="close-dropdown-btn"
                                        >
                                          Sluiten
                                        </button>
                                      </div>
                                    )}
                                    
                                    <div className="spotify-details">
                                      <div className="form-row">
                                        <label>Track ID:</label>
                                        <input 
                                          type="text"
                                          placeholder="spotify:track:xxxxx"
                                          value={question.spotify?.track_id || ''}
                                          onChange={(e) => {
                                            const updated = [...parsedData];
                                            if (!updated[selectedRound].questions[qIndex].spotify) {
                                              updated[selectedRound].questions[qIndex].spotify = {};
                                            }
                                            updated[selectedRound].questions[qIndex].spotify.track_id = e.target.value;
                                            setParsedData(updated);
                                            setJsonContent(JSON.stringify(updated, null, 2));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="form-row">
                                        <label>Start (sec):</label>
                                        <input 
                                          type="number"
                                          placeholder="30"
                                          value={question.spotify?.start_position || 30}
                                          onChange={(e) => {
                                            const updated = [...parsedData];
                                            if (!updated[selectedRound].questions[qIndex].spotify) {
                                              updated[selectedRound].questions[qIndex].spotify = {};
                                            }
                                            updated[selectedRound].questions[qIndex].spotify.start_position = parseInt(e.target.value) || 0;
                                            setParsedData(updated);
                                            setJsonContent(JSON.stringify(updated, null, 2));
                                          }}
                                        />
                                      </div>
                                      
                                      <div className="form-row">
                                        <label>Duur (sec):</label>
                                        <input 
                                          type="number"
                                          placeholder="30"
                                          value={question.spotify?.duration || 30}
                                          onChange={(e) => {
                                            const updated = [...parsedData];
                                            if (!updated[selectedRound].questions[qIndex].spotify) {
                                              updated[selectedRound].questions[qIndex].spotify = {};
                                            }
                                            updated[selectedRound].questions[qIndex].spotify.duration = parseInt(e.target.value) || 30;
                                            setParsedData(updated);
                                            setJsonContent(JSON.stringify(updated, null, 2));
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {parsedData[selectedRound].type === 'question' && (
                                <input 
                                  type="text"
                                  placeholder="Vraag"
                                  value={question.text}
                                  onChange={(e) => {
                                    const updated = [...parsedData];
                                    updated[selectedRound].questions[qIndex].text = e.target.value;
                                    setParsedData(updated);
                                    setJsonContent(JSON.stringify(updated, null, 2));
                                  }}
                                />
                              )}
                              
                              <input 
                                type="text"
                                placeholder="Antwoord"
                                value={question.answer}
                                onChange={(e) => {
                                  const updated = [...parsedData];
                                  updated[selectedRound].questions[qIndex].answer = e.target.value;
                                  setParsedData(updated);
                                  setJsonContent(JSON.stringify(updated, null, 2));
                                }}
                              />
                            </div>
                            <button 
                              onClick={() => deleteQuestion(selectedRound, qIndex)}
                              className="delete-btn"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="json-editor-container">
              <textarea
                className="json-editor"
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                placeholder="Loading quiz data..."
                spellCheck={false}
                disabled={isLoading}
              />
              <div className="json-help">
                <h4>JSON Tips:</h4>
                <ul>
                  <li>Gebruik Ctrl+A om alles te selecteren</li>
                  <li>Kopieer naar ChatGPT/Claude voor hulp</li>
                  <li>Validatie gebeurt bij opslaan</li>
                  <li>Download eerst een backup!</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizManager;