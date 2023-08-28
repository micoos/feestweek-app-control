import logo from './logo.svg';
import './App.css';
import { useState, useRef } from 'react';

function App() {
  const [response, setResponse] = useState('');
  const messageRef = useRef(null);

  const handleRestartDisplay = () => {
    fetch('http://127.0.0.1:8090/restart')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to restart display');
        }
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

  const handleShowMessage = message => {
    if(message==='') { 
      setResponse('Please enter a message');
      setTimeout(() => {
        setResponse('');
      }, 10000);
      return;
    }
    fetch(`http://127.0.0.1:8090/show?message=${message}`)
      .then(response => {
        if (!response.ok) {
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

  return (
    <div className="App">
      <button onClick={handleRestartDisplay}>Restart Display</button>
      <button onClick={() => handleShowMessage(messageRef.current.value)}>Show Message</button>
      <textarea type="text" id="message" ref={messageRef} />
      {response && <div className="status">{response}</div>}
    </div>
  );
}

export default App;