import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

const Page1: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [input, setInput] = useState('');
  const [sender, setSender] = useState('');

  useEffect(() => {
    socket.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off('message');
    };
  }, []);

  const sendMessage = () => {
    socket.emit('message', { sender, message: input });
    setInput('');
  };

  return (
    <div className="App">
      <div>
        <input
          type="text"
          placeholder="My name!"
          value={sender}
          onChange={(e) => setSender(e.target.value)}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}:</strong> {msg.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page1;
