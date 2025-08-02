import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Edit, Send, Clock, ArrowLeft } from 'lucide-react';
import config from '../config';

function MessagesManager({ onGoBack }) {
  const [messages, setMessages] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createMessage = async () => {
    if (!newContent.trim()) return;
    
    setLoading(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      
      const response = await fetch(`${config.API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          priority: priority,
          status: 'active',
          display_duration: 15000,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          is_active: true
        })
      });
      
      if (response.ok) {
        setNewTitle('');
        setNewContent('');
        setPriority('normal');
        loadMessages();
      } else {
        const error = await response.json();
        console.error('Error creating message:', error);
        alert('Fout bij aanmaken bericht: ' + (error.error || 'Onbekende fout'));
      }
    } catch (error) {
      console.error('Error creating message:', error);
      alert('Fout bij aanmaken bericht');
    }
    setLoading(false);
  };

  const updateMessage = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          content: editContent
        })
      });
      
      if (response.ok) {
        setEditingId(null);
        setEditTitle('');
        setEditContent('');
        loadMessages();
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
    setLoading(false);
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Weet je zeker dat je dit bericht wilt verwijderen?')) return;
    
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/messages/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadMessages();
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const displayMessageNow = async (id) => {
    try {
      await fetch(`${config.API_BASE_URL}/api/messages/${id}/display`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error displaying message:', error);
    }
  };

  const toggleStatus = async (message) => {
    try {
      const messageId = message._id || message.id;
      const response = await fetch(`${config.API_BASE_URL}/api/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_active: !message.is_active
        })
      });
      
      if (response.ok) {
        loadMessages();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <div className="messages-manager">
      <div className="manager-header">
        <button onClick={onGoBack} className="btn back-btn">
          <ArrowLeft className="icon" size={20} />
        </button>
        <h3><MessageSquare className="icon" size={20} /> Berichten Beheer</h3>
      </div>
      
      <div className="message-input-section">
        <div className="message-form">
          <input
            type="text"
            placeholder="Titel (optioneel)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="input input-title"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Bericht..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) {
                createMessage();
              }
            }}
            className="input"
            disabled={loading}
          />
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            className="select"
          >
            <option value="low">Laag</option>
            <option value="normal">Normaal</option>
            <option value="high">Hoog</option>
            <option value="urgent">Urgent</option>
          </select>
          <button 
            onClick={createMessage} 
            className="btn btn-green"
            disabled={loading || !newContent.trim()}
          >
            <Plus className="icon" size={16} />
            Toevoegen
          </button>
        </div>
      </div>

      <div className="messages-list">
        {messages.map(message => {
          const messageId = message._id || message.id;
          return (
          <div key={messageId} className={`message-item priority-${message.priority}`}>
            {editingId === messageId ? (
              <div className="edit-mode">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Titel"
                  className="input input-title"
                />
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') updateMessage(messageId);
                    if (e.key === 'Escape') {
                      setEditingId(null);
                      setEditTitle('');
                      setEditContent('');
                    }
                  }}
                  placeholder="Bericht"
                  className="input"
                  autoFocus
                />
                <button 
                  onClick={() => updateMessage(messageId)}
                  className="btn btn-sm btn-green"
                >
                  Opslaan
                </button>
                <button 
                  onClick={() => {
                    setEditingId(null);
                    setEditTitle('');
                    setEditContent('');
                  }}
                  className="btn btn-sm"
                >
                  Annuleren
                </button>
              </div>
            ) : (
              <>
                <div className="message-content">
                  <span className={`status-indicator ${message.is_active ? 'active' : 'inactive'}`}></span>
                  <div className="message-text">
                    {message.title && <strong>{message.title}: </strong>}
                    {message.content}
                  </div>
                  <span className="priority-badge">{message.priority}</span>
                </div>
                <div className="message-actions">
                  <button
                    onClick={() => displayMessageNow(messageId)}
                    className="btn btn-sm btn-blue"
                    title="Nu tonen"
                  >
                    <Send size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(messageId);
                      setEditTitle(message.title || '');
                      setEditContent(message.content);
                    }}
                    className="btn btn-sm"
                    title="Bewerken"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => toggleStatus(message)}
                    className="btn btn-sm"
                    title={message.is_active ? 'Deactiveren' : 'Activeren'}
                  >
                    <Clock size={14} />
                  </button>
                  <button
                    onClick={() => deleteMessage(messageId)}
                    className="btn btn-sm btn-red"
                    title="Verwijderen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </>
            )}
          </div>
        )})}
      </div>

      <style jsx>{`
        .messages-manager {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          z-index: 1000;
          overflow-y: auto;
          padding: 20px;
        }

        .manager-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .manager-header h3 {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }

        .back-btn {
          padding: 8px;
          background: #f3f4f6;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .back-btn:hover {
          background: #e5e7eb;
        }

        .message-input-section {
          margin-bottom: 20px;
        }

        .message-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .message-form .input {
          flex: 1;
        }

        .message-form .input-title {
          flex: 0 0 200px;
        }

        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .message-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 6px;
          border-left: 4px solid #ccc;
        }

        .message-item.priority-low {
          border-left-color: #6b7280;
        }

        .message-item.priority-normal {
          border-left-color: #3b82f6;
        }

        .message-item.priority-high {
          border-left-color: #f59e0b;
        }

        .message-item.priority-urgent {
          border-left-color: #ef4444;
        }

        .message-content {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .status-indicator {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #ccc;
        }

        .status-indicator.active {
          background: #10b981;
        }

        .status-indicator.inactive {
          background: #ef4444;
        }

        .message-text {
          margin: 0;
          flex: 1;
        }

        .message-text strong {
          color: #1f2937;
        }

        .priority-badge {
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 4px;
          background: #e5e7eb;
          text-transform: uppercase;
        }

        .message-actions {
          display: flex;
          gap: 5px;
        }

        .edit-mode {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .edit-mode .input {
          flex: 1;
        }

        .btn-sm {
          padding: 5px 10px;
          font-size: 12px;
        }

        .select {
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
        }
      `}</style>
    </div>
  );
}

export default MessagesManager;