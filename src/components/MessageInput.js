// components/MessageInput.js
import React, { useRef } from 'react';
import { MessageSquare } from 'lucide-react';

function MessageInput({ onSendMessage, loading }) {
  const messageRef = useRef(null);

  return (
    <div className="app-input">
      <input
        type="text"
        placeholder="Enter message"
        ref={messageRef}
        className="input"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !loading) {
            onSendMessage(messageRef.current.value);
            messageRef.current.value = '';
          }
        }}
        disabled={loading}
      />
      <button onClick={() => { onSendMessage(messageRef.current.value); messageRef.current.value = ''; }} className="btn btn-blue" disabled={loading}>
        <MessageSquare className="icon" size={20} />
        Show Message
      </button>
    </div>
  );
}

export default MessageInput;
