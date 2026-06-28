import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { X, Send, User, Wrench } from 'lucide-react';
import './ChatBox.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ChatBox = ({ requestId, onClose, autoConnect = true }) => {
    const { user, token } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Normalize user ID — login returns `id`, but some paths may use `_id`
    const myId = String(user?._id || user?.id || '');

    // Fetch message history
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API}/api/chat/${requestId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (error) {
                console.error('Failed to load chat history', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (requestId && token) {
            fetchMessages();
        }
    }, [requestId, token]);

    // Socket.io connection for real-time messages
    useEffect(() => {
        if (!autoConnect || !requestId) return;

        const newSocket = io(API);
        setSocket(newSocket);

        newSocket.emit('joinRoom', requestId);

        newSocket.on('newMessage', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, [requestId, autoConnect]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !user) return;

        const messageData = {
            requestId,
            senderId: myId,
            senderRole: user.role,
            text: newMessage.trim()
        };

        socket.emit('chatMessage', messageData);
        setNewMessage('');
    };

    return (
        <div className="chatbox-container fade-in">
            <div className="chatbox-header">
                <div className="chatbox-title">
                    <span className="chatbox-status-dot"></span>
                    Live Chat
                </div>
                <button className="chatbox-close-btn" onClick={onClose} aria-label="Close Chat">
                    <X size={20} />
                </button>
            </div>

            <div className="chatbox-messages">
                {isLoading ? (
                    <div className="chatbox-loading">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="chatbox-empty">
                        <p>No messages yet.</p>
                        <p>Say hello!</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = String(msg.senderId) === myId;
                        return (
                            <div key={idx} className={`chatbox-message ${isMe ? 'me' : 'other'}`}>
                                <div className="chatbox-message-avatar">
                                    {msg.senderRole === 'mechanic' ? <Wrench size={12} /> : <User size={12} />}
                                </div>
                                <div className="chatbox-message-content">
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chatbox-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="chatbox-input"
                />
                <button type="submit" className="chatbox-send-btn" disabled={!newMessage.trim()}>
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatBox;
