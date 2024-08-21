import React, { useState, useRef } from 'react';
import './App.css';
import mqtt from 'mqtt/dist/mqtt'

const mqttClient  = mqtt.connect('ws://swarm2:9001', { clientId: 'control_' + Math.random().toString(16).substr(2, 8)})

mqttClient.on('connect', function () {
  mqttClient.subscribe('control/action', function (err) { console.log(err) }); //to do error handling
});

mqttClient.on("message", (topic, message) => {
  // message is Buffer
  console.log(message.toString());
});

const reconnect = () => {
  setTimeout(() => {
    mqttClient.reconnect();
  }, 5000);
}

mqttClient.on('close', () => {
  console.log('Connection closed. Trying to reconnect...');
  reconnect();
});


function App() {
  const [response, setResponse] = useState('');
  const messageRef = useRef(null);
  const urlRef = useRef(null);

  const handleRestartDisplay = () => {
    mqttClient.publish('control/action', 'restart')
    setResponse('Display restarted successfully');
    setTimeout(() => {
      setResponse('');
    }, 10000);
  };

  const handleShowGallery = () => {
    mqttClient.publish('control/action', 'gallery')
    setResponse('Display changed successfully to gallery');
    setTimeout(() => {
      setResponse('');
    }, 10000);
  };

  const handleShowMessage = (message) => {
    //strip : from message
    message = message.replace(/:/g, '');
    mqttClient.publish('control/action', 'message:' + message)
    setResponse(`Message "${message}" shown successfully`);
    setTimeout(() => {
      setResponse('');
    }, 10000);

    messageRef.current.value = '';
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
      <button onClick={handleShowGallery}>show gallery</button>
      <button onClick={() => handleShowMessage(messageRef.current.value)}>Show Message</button>
      <textarea placeholder="je bericht" type="text" id="message" ref={messageRef} onKeyDown={(event) => {
        if (event.keyCode === 13) {
          handleShowMessage(messageRef.current.value);
        }
      }} />
      {response && <div className="status">{response}</div>}
    </div>
  );
}

export default App;