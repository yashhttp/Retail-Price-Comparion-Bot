import { useState } from "react";

const ChatbotPanel = ({ onSend, messages }) => {
  const [text, setText] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }
    onSend(text);
    setText("");
  };

  return (
    <div className="card chatbot">
      <div className="card-title">Price Bot</div>
      <div className="chat-window">
        {messages.length === 0 ? (
          <p className="muted">Ask about the cheapest price near you.</p>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`chat-bubble ${message.sender}`}>
              {message.text}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="chat-input">
        <input
          type="text"
          placeholder="Ask: cheapest rice near me?"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <button className="primary-btn" type="submit">
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatbotPanel;
