// Frontend/src/Components/ChatWithPDF/ChatWithPDF.jsx

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatWithPDF.css';

const ChatWithPDF = ({ resourceId, resourceTitle, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I've read "${resourceTitle}". Ask me anything about it — definitions, summaries, key points, or explanations!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      // Build history excluding the first greeting message
      const history = updatedMessages.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await axios.post(
        `http://localhost:3000/api/v1/chat/${resourceId}`,
        { message: trimmed, history: history.slice(0, -1) }, // don't send last user msg twice
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.data.reply },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.msg || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-overlay">
      <div className="chat-panel">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <span className="chat-ai-badge">AI</span>
            <div>
              <div className="chat-header-title">Chat with PDF</div>
              <div className="chat-header-subtitle">{resourceTitle}</div>
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose} title="Close chat">
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chat-bubble-wrap ${msg.role === 'user' ? 'user' : 'assistant'}`}
            >
              <div className={`chat-bubble ${msg.role}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-bubble-wrap assistant">
              <div className="chat-bubble assistant chat-typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}

          {error && (
            <div className="chat-error">{error}</div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something about this PDF..."
            rows={2}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
        <div className="chat-hint">Press Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  );
};

export default ChatWithPDF;