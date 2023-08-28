import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [response, setResponse] = useState('');
  const messageRef = useRef(null);
  const urlRef = useRef(null);

  const handleRestartDisplay = () => {
    fetch('http://raspberrypi:8090/restart', { method: 'GET' })
      .then(response => {
        console.log(response);
        setResponse('Display restarted successfully');
        setTimeout(() => {
          setResponse('');
        }, 10000);
      })
      .catch(error => {
        console.error(error);
        setResponse('Failed to restart display');
        setTimeout(() => {
          setResponse('');
        }, 10000);
      });
  };

  const handleShowMessage = (message) => {
    fetch('http://raspberrypi:8090/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
      .then(response => {
        console.log(response);
        if (response.status !== 200) {
          throw new Error('Failed to show message');
        }
        messageRef.current.value = '';
        setResponse(`Message "${message}" shown successfully`);
        setTimeout(() => {
          setResponse('');
        }, 10000);
      })
      .catch(error => {
        console.error(error);
        setResponse('Failed to show message');
        setTimeout(() => {
          setResponse('');
        }, 10000);
      });
  };

  const handleScrapeUrl = () => {
    const url = urlRef.current.value;
    if(url == "") { 
      setResponse('No URL given');
      setTimeout(() => {
        setResponse('');
      }, 10000);
      return;
    }
    fetch('http://raspberrypi:8090/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
      .then(response => {
        console.log(response);
        setResponse(`Scraped URL "${url}" successfully`);
        setTimeout(() => {
          setResponse('');
        }, 10000);
      })
      .catch(error => {
        console.error(error);
        setResponse(`Failed to scrape URL "${url}"`);
        setTimeout(() => {
          setResponse('');
        }, 10000);
      });
  };

  return (
    <div className="App">
      <button onClick={handleRestartDisplay}>Restart Display</button>
      <input placeholder="https//eenurlhier.nl" type="text" id="url" ref={urlRef} />
      <button onClick={handleScrapeUrl}>Scrape URL</button>
      <button onClick={() => handleShowMessage(messageRef.current.value)}>Show Message</button>
      <textarea placeholder="je bericht" type="text" id="message" ref={messageRef} />      
      {response && <div className="status">{response}</div>}
    </div>
  );
}

export default App;