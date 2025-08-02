// Event names for Socket.IO communication
export const EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Control events
  CONTROL_ACTION: 'control_action',
  CONTROL_MESSAGE: 'control_message',
  CONTROL_MEDIA: 'control_media',
  
  // State events
  STATE_UPDATE: 'state:update',
  CLIENTS_UPDATE: 'clients:update',
  REQUEST_STATE: 'request_state',
  
  // DJ events
  DJ_UPDATE: 'dj_update',
  DJ_TRACK: 'dj:track',
  DJ_PLAYLIST: 'dj:playlist',
  DJ_ENERGY: 'dj:energy',
  
  // Display events
  DISPLAY_MODE: 'display:mode',
  DISPLAY_MESSAGE: 'display:message',
  DISPLAY_YOUTUBE: 'display:youtube',
  DISPLAY_IMAGE: 'display:image',
  DISPLAY_VIDEO: 'display:video',
  
  // Dart events
  DART_UPDATE: 'dart_update',
  DART_DISPLAY: 'dart:update'
};

// Display modes
export const MODES = {
  GALLERY: 'gallery',
  PARTY: 'party',
  BLACK: 'black',
  DJ: 'dj',
  MESSAGE: 'message',
  YOUTUBE: 'youtube',
  IMAGE: 'image',
  VIDEO: 'video',
  DART: 'dart',
  RESTART: 'restart'
};

// Client types
export const CLIENT_TYPES = {
  DISPLAY: 'display',
  CONTROL: 'control',
  UNKNOWN: 'unknown'
};

// Media types
export const MEDIA_TYPES = {
  YOUTUBE: 'youtube',
  IMAGE: 'image',
  VIDEO: 'video',
  URL: 'url'
};

// DJ playback states
export const PLAYBACK_STATES = {
  PLAYING: 'playing',
  PAUSED: 'paused',
  STOPPED: 'stopped'
};

// API endpoints
export const ENDPOINTS = {
  GET_PLAYLIST: '/get_playlist',
  START_DJ_MODE: '/start_dj_mode',
  STOP_DJ_MODE: '/stop_dj_mode',
  SKIP_TRACK: '/skip_track',
  PAUSE_PLAYBACK: '/pause_playback',
  RESUME_PLAYBACK: '/resume_playback',
  CHANGE_ENERGY: '/change_energy_level',
  AI_PLAYLIST_UPDATE: '/ai_playlist_update',
  UPLOAD: '/upload',
  DELETE: '/delete',
  SCRAPE: '/scrape',
  AI_PROMPT: '/ai-prompt'
};