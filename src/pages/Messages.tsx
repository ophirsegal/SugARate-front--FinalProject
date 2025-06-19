// pages/Messages.tsx
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import chatService, { ChatPreview, ChatMessage } from '../services/chatService';
import UserContacts from '../components/UserContacts';

const Avatar = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-[#8B7355] text-white flex items-center justify-center ${className}`}>
    {children}
  </div>
);

interface User {
  id: string;
  username: string;
  email: string;
}

const Messages = () => {
  const location = useLocation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<{ userId: string; username: string } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser: User = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
//socket io
  // [Previous useEffect blocks remain unchanged]
  useEffect(() => {
    fetchChats();
    const newSocket = io('http://localhost:5000', {
      auth: { token }
    });
    setSocket(newSocket);

    newSocket.on('receive_message', (message) => {
      console.log('Received message:', message);
      setMessages(prev => [
        ...prev,
        {
          id: message.id,
          senderId: message.senderId,
          text: message.text,
          timestamp: message.timestamp
        }
      ]);
      fetchChats();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (location.state && location.state.activeChat) {
      setActiveChat(location.state.activeChat);
      if (location.state.chatUser) {
        setSelectedChatUser(location.state.chatUser);
      }
      chatService.getChatMessages(currentUser.id, location.state.activeChat)
        .then((chatMessages) => {
          setMessages(chatMessages);
        })
        .catch((err: any) => setError(err.message));
    }
  }, [location.state, currentUser.id]);

  // [Previous functions remain unchanged]
  const fetchChats = async () => {
    try {
      const fetchedChats = await chatService.getUserChats(currentUser.id);
      console.log(fetchedChats);
      setChats(fetchedChats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = async (userId: string) => {
    setActiveChat(userId);
    const chat = chats.find(chat => chat.userId === userId);
    if (chat) {
      setSelectedChatUser({ userId: chat.userId, username: chat.username });
    }
    try {
      await chatService.markMessagesAsRead(currentUser.id, userId);
      const chatMessages = await chatService.getChatMessages(currentUser.id, userId);
      setMessages(chatMessages);
      fetchChats();
    } catch (err: any) {
      setError(err.message);
    }
  };
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !socket) return;
  
    socket.emit('send_message', {
      senderId: currentUser.id,
      receiverId: activeChat,
      text: newMessage,
    });
  
    setNewMessage('');
  
    // Mark any unread messages as read since the chat is active
    try {
      await chatService.markMessagesAsRead(currentUser.id, activeChat);
      fetchChats();
    } catch (error: any) {
      setError(error.message);
    }
  };
  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[92vh] bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B7355]"></div>
      </div>
    );
  }

  const headerUsername = selectedChatUser
    ? selectedChatUser.username
    : (chats.find(chat => chat._id === activeChat)?.username || "Unknown");

  return (
    <div className="flex h-[92vh] p-3 gap-3 bg-gradient-to-br from-[#F5F5DC] to-[#E8DCC4]">
      <UserContacts 
        chats={chats}
        activeChat={activeChat}
        error={error}
        onChatSelect={handleChatSelect}
      />

      {activeChat ? (
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-md flex flex-col">
          <div className="p-4 flex items-center border-b border-[#8B7355]/20">
            <Avatar className="mr-3">
              {headerUsername[0]}
            </Avatar>
            <h6 className="text-lg font-medium text-[#8B7355]">
              {headerUsername}
            </h6>
          </div>

          <div className="flex-1 p-4 bg-[#F5F5DC]/30 overflow-auto flex flex-col gap-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-4 rounded-xl shadow-sm ${
                      message.senderId === currentUser.id 
                        ? 'bg-[#8B7355] text-white' 
                        : 'bg-white/80 text-[#8B7355]'
                    }`}
                  >
                    <p className="break-words">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[#8B7355]/70">No messages yet</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 flex gap-2 border-t border-[#8B7355]/20 bg-white/80">
            <input
              type="text"
              className="flex-1 border border-[#8B7355]/30 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B7355]/50 placeholder:text-[#8B7355]/40 bg-white/50"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="text-[#8B7355] p-2 rounded-lg hover:bg-[#8B7355]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-md flex items-center justify-center">
          <p className="text-lg text-[#8B7355]/70">
            Select a chat to start messaging
          </p>
        </div>
      )}
    </div>
  );
};

export default Messages;