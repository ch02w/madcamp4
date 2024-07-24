import React, { useEffect, useState, useRef } from 'react';
import socketService from '../services/SocketService';
import { FaCommentDots, FaCheck } from 'react-icons/fa';

const ChatComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [input, setInput] = useState('');
  const [sender, setSender] = useState(`익명${Math.floor(Math.random() * 1000)}`); // 익명 사용자 이름 생성
  const [header, setHeader] = useState('1분반 화이팅!');
  const [headerInput, setHeaderInput] = useState(header);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketService.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socketService.on('header', (newHeader) => {
      setHeader(newHeader);
      setHeaderInput(newHeader);
    });

    return () => {
      socketService.off('message');
      socketService.off('header');
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      document.addEventListener('click', handleClickOutside, true);
    } else {
      document.removeEventListener('click', handleClickOutside, true);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClickOutside = (event: MouseEvent) => {
    if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = () => {
    if (input.trim() !== '') {
      socketService.emit('message', { sender, message: input });
      setInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  const handleHeaderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHeaderInput(event.target.value);
  };

  const updateHeader = () => {
    setHeader(headerInput);
    socketService.emit('header', headerInput);
  };

  const handleHeaderKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      updateHeader();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <button
        onClick={toggleChat}
        className="fixed bottom-4 right-4 bg-blue-500 text-white rounded-full shadow-lg"
        style={{ zIndex: 10000, width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <FaCommentDots className="h-6 w-6" />
      </button>
      <div
        className={`fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-300 shadow-lg rounded-lg transition-transform duration-300 ${
          isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        style={{
          zIndex: 10000,
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s ease, opacity 0.3s ease'
        }}
        ref={chatRef}
      >
        <div className="p-4 flex flex-col h-full">
          <div className="mb-2 flex">
            <input
              type="text"
              value={headerInput}
              onChange={handleHeaderChange}
              onKeyPress={handleHeaderKeyPress}
              className="w-full border border-gray-300 rounded p-2 mb-2 flex-grow"
            />
          </div>
          <div className="overflow-y-scroll h-64 mb-2 flex-grow">
            {messages.map((msg, index) => (
              <div key={index} className="mb-2">
                <strong>{msg.sender}:</strong> {msg.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full border border-gray-300 rounded p-2 mb-2"
          />
          <button onClick={sendMessage} className="bg-blue-500 text-white py-2 px-4 rounded">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
