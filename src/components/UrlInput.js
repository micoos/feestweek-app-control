// components/UrlInput.js
import React, { useRef } from 'react';
import { Link } from 'lucide-react';

function UrlInput({ handleScrapeUrl }) {
  const urlRef = useRef(null);

  return (
    <div className="app-input">
      <input
        type="text"
        placeholder="https://eenurlhier.nl"
        ref={urlRef}
        className="input"
      />
      <button onClick={() => handleScrapeUrl(urlRef.current.value)} className="btn btn-purple">
        <Link className="icon" size={20} />
        Scrape URL
      </button>
    </div>
  );
}

export default UrlInput;
