import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';
import { SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import './ShortcutsHelp.css';

const ShortcutsHelp = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="shortcuts-overlay" onClick={onClose} />
      <div className="shortcuts-modal">
        <div className="shortcuts-header">
          <h2>
            <Keyboard size={24} />
            Keyboard Shortcuts
          </h2>
          <button className="shortcuts-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="shortcuts-content">
          <div className="shortcuts-list">
            {SHORTCUTS.map((shortcut, index) => (
              <div key={index} className="shortcut-item">
                <kbd className="shortcut-key">{shortcut.key}</kbd>
                <span className="shortcut-description">{shortcut.description}</span>
              </div>
            ))}
          </div>
          <p className="shortcuts-note">
            Press <kbd>Esc</kbd> to close this dialog
          </p>
        </div>
      </div>
    </>
  );
};

export default ShortcutsHelp;