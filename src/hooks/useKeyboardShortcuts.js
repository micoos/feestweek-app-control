import { useEffect, useCallback } from 'react';
import { MODES } from '../constants';

export const useKeyboardShortcuts = (actions, isAnyManagerOpen) => {
  const handleKeyPress = useCallback((event) => {
    // Don't trigger shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    // Don't trigger shortcuts when media managers are open
    if (isAnyManagerOpen) {
      return;
    }

    // Ctrl/Cmd + key combinations
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 'm':
          event.preventDefault();
          // Focus message input
          const messageInput = document.querySelector('.app-input input');
          if (messageInput) messageInput.focus();
          break;
        case 'd':
          event.preventDefault();
          actions.toggleDJ();
          break;
        default:
          break;
      }
      return;
    }

    // Single key shortcuts
    switch (event.key.toLowerCase()) {
      case '1':
        actions.sendControlAction(MODES.GALLERY);
        break;
      case '2':
        actions.sendControlAction(MODES.PARTY);
        break;
      case '3':
        actions.sendControlAction(MODES.BLACK);
        break;
      case '4':
        actions.sendControlAction(MODES.DJ);
        break;
      case 'r':
        actions.sendControlAction(MODES.RESTART);
        break;
      case 'y':
        actions.toggleYouTubeManager();
        break;
      case 'i':
        actions.toggleImageManager();
        break;
      case 'v':
        actions.toggleVideoManager();
        break;
      case 's':
        actions.toggleDartScoreboardCapture();
        break;
      case 'p':
        actions.toggleProgramManager();
        break;
      case '?':
        actions.showShortcutsHelp();
        break;
      default:
        break;
    }
  }, [actions, isAnyManagerOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
};

export const SHORTCUTS = [
  { key: '1', description: 'Gallery mode' },
  { key: '2', description: 'Party mode' },
  { key: '3', description: 'Black mode' },
  { key: '4', description: 'DJ mode' },
  { key: 'R', description: 'Restart display' },
  { key: 'Y', description: 'YouTube manager' },
  { key: 'I', description: 'Image manager' },
  { key: 'V', description: 'Video manager' },
  { key: 'S', description: 'Dart scoreboard' },
  { key: 'P', description: 'Program manager' },
  { key: 'Ctrl+M', description: 'Focus message input' },
  { key: 'Ctrl+D', description: 'Toggle DJ mode' },
  { key: '?', description: 'Show this help' }
];