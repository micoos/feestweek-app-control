import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit2, Trash2, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import config from '../config';

const PROGRAM_TYPES = [
  { value: 'music', label: 'Muziek' },
  { value: 'performance', label: 'Optreden' },
  { value: 'activity', label: 'Activiteit' },
  { value: 'break', label: 'Pauze' },
  { value: 'announcement', label: 'Aankondiging' }
];

function ProgramManager({ socketClient, onGoBack }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingProgram, setEditingProgram] = useState(null);
  const [showProgramForm, setShowProgramForm] = useState(false);

  // Program form state
  const [programForm, setProgramForm] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    type: 'activity',
    location: '',
    artist: ''
  });

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Load programs when event is selected
  useEffect(() => {
    if (selectedEvent) {
      loadPrograms(selectedEvent.id);
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/events`);
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
        // Auto-select het actieve event (feestweek)
        const activeEvent = data.events.find(e => e.status === 'active');
        if (activeEvent) {
          setSelectedEvent(activeEvent);
        }
      }
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPrograms = async (eventId) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/programs/event/${eventId}`);
      const data = await response.json();
      if (data.success) {
        // Flatten programs by date
        const allPrograms = [];
        Object.values(data.programs_by_date).forEach(dayPrograms => {
          allPrograms.push(...dayPrograms);
        });
        setPrograms(allPrograms);
      }
    } catch (err) {
      setError('Failed to load programs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProgram = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = editingProgram 
        ? `${config.API_BASE_URL}/api/programs/${editingProgram.id}`
        : `${config.API_BASE_URL}/api/programs`;
      
      const method = editingProgram ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...programForm,
          event_id: selectedEvent.id
        })
      });

      const data = await response.json();
      if (data.success) {
        await loadPrograms(selectedEvent.id);
        resetForm();
      } else {
        setError(data.error || 'Failed to save program');
      }
    } catch (err) {
      setError('Failed to save program');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProgram = (program) => {
    setProgramForm({
      title: program.title || '',
      description: program.description || '',
      date: program.date ? program.date.split('T')[0] : '',
      start_time: program.start_time || '',
      end_time: program.end_time || '',
      type: program.type || 'activity',
      location: program.location || '',
      artist: program.artist || ''
    });
    setEditingProgram(program);
    setShowProgramForm(true);
  };

  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Weet je zeker dat je dit programma onderdeel wilt verwijderen?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/programs/${programId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadPrograms(selectedEvent.id);
      }
    } catch (err) {
      setError('Failed to delete program');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendProgramToDisplay = () => {
    if (socketClient) {
      socketClient.emit('control:action', { action: 'program' });
    }
  };

  const sendSpecificProgramToDisplay = (program) => {
    if (socketClient) {
      // Stuur programma details naar display
      socketClient.emit('control:program', {
        mode: 'single',
        program: {
          title: program.title,
          description: program.description,
          time: `${program.start_time} - ${program.end_time}`,
          location: program.location,
          artist: program.artist,
          type: program.type
        }
      });
    }
  };

  const resetForm = () => {
    setProgramForm({
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      type: 'activity',
      location: '',
      artist: ''
    });
    setEditingProgram(null);
    setShowProgramForm(false);
  };

  const formatDateTime = (date, time) => {
    const dateObj = new Date(date);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return `${dateObj.toLocaleDateString('nl-NL', options)} om ${time}`;
  };

  return (
    <div className="manager-container">
      <div className="manager-header">
        <button onClick={onGoBack} className="back-button">
          <ArrowLeft size={20} />
          Terug
        </button>
        <h2>Programma Beheer</h2>
        <button onClick={loadEvents} className="refresh-button" disabled={loading}>
          <RefreshCw size={20} className={loading ? 'spinning' : ''} />
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!selectedEvent ? (
        <div className="event-selector">
          <h3>Selecteer een evenement</h3>
          <div className="event-list">
            {events.map(event => (
              <div 
                key={event.id} 
                className={`event-item ${event.status === 'active' ? 'active' : ''}`}
                onClick={() => setSelectedEvent(event)}
              >
                <h4>{event.name}</h4>
                <p>{event.description}</p>
                <span className={`status ${event.status}`}>{event.status}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="selected-event">
            <h3>{selectedEvent.name}</h3>
            <button 
              onClick={() => setSelectedEvent(null)} 
              className="change-event-btn"
            >
              Ander evenement
            </button>
            <button 
              onClick={sendProgramToDisplay} 
              className="send-to-display-btn"
            >
              Toon op scherm
            </button>
          </div>

          {!showProgramForm ? (
            <>
              <div className="action-buttons">
                <button 
                  onClick={() => setShowProgramForm(true)} 
                  className="add-button"
                >
                  <Plus size={20} />
                  Programma toevoegen
                </button>
              </div>

              <div className="program-list">
                {programs.length === 0 ? (
                  <p className="no-programs">Nog geen programma onderdelen</p>
                ) : (
                  programs.map(program => (
                    <div key={program.id} className="program-item">
                      <div className="program-info">
                        <h4>{program.title}</h4>
                        <p className="program-time">
                          <Clock size={16} />
                          {formatDateTime(program.date, program.start_time)} - {program.end_time}
                        </p>
                        {program.location && (
                          <p className="program-location">📍 {program.location}</p>
                        )}
                        {program.artist && (
                          <p className="program-artist">🎤 {program.artist}</p>
                        )}
                        <span className={`program-type ${program.type}`}>
                          {PROGRAM_TYPES.find(t => t.value === program.type)?.label || program.type}
                        </span>
                      </div>
                      <div className="program-actions">
                        <button 
                          onClick={() => sendSpecificProgramToDisplay(program)}
                          className="show-button"
                          title="Toon op scherm"
                        >
                          📺
                        </button>
                        <button 
                          onClick={() => handleEditProgram(program)}
                          className="edit-button"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProgram(program.id)}
                          className="delete-button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmitProgram} className="program-form">
              <h3>{editingProgram ? 'Programma bewerken' : 'Nieuw programma onderdeel'}</h3>
              
              <div className="form-group">
                <label htmlFor="title">Titel *</label>
                <input
                  type="text"
                  id="title"
                  value={programForm.title}
                  onChange={(e) => setProgramForm({...programForm, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Type *</label>
                <select
                  id="type"
                  value={programForm.type}
                  onChange={(e) => setProgramForm({...programForm, type: e.target.value})}
                  required
                >
                  {PROGRAM_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Datum *</label>
                  <input
                    type="date"
                    id="date"
                    value={programForm.date}
                    onChange={(e) => setProgramForm({...programForm, date: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="start_time">Starttijd *</label>
                  <input
                    type="time"
                    id="start_time"
                    value={programForm.start_time}
                    onChange={(e) => setProgramForm({...programForm, start_time: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end_time">Eindtijd *</label>
                  <input
                    type="time"
                    id="end_time"
                    value={programForm.end_time}
                    onChange={(e) => setProgramForm({...programForm, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Locatie</label>
                <input
                  type="text"
                  id="location"
                  value={programForm.location}
                  onChange={(e) => setProgramForm({...programForm, location: e.target.value})}
                  placeholder="Bijv. Feesttent, Kerk, Sportveld"
                />
              </div>

              {programForm.type === 'music' && (
                <div className="form-group">
                  <label htmlFor="artist">Artiest/Band</label>
                  <input
                    type="text"
                    id="artist"
                    value={programForm.artist}
                    onChange={(e) => setProgramForm({...programForm, artist: e.target.value})}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="description">Beschrijving</label>
                <textarea
                  id="description"
                  value={programForm.description}
                  onChange={(e) => setProgramForm({...programForm, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-button">
                  Annuleren
                </button>
                <button type="submit" className="save-button" disabled={loading}>
                  <Save size={16} />
                  {editingProgram ? 'Opslaan' : 'Toevoegen'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default ProgramManager;