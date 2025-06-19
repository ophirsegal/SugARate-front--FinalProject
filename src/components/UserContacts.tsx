import React from 'react';
import { formatTimestamp } from '../utils/utils';
interface Contact {
  _id: string;
  username: string;
  email: string;
  lastMessage?: { 
    text: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount?: number; // New field for unread messages
}

interface UserContactsProps {
  chats: { contacts: Contact[] } | Contact[];
  activeChat: string | null;
  error?: string;
  onChatSelect: (userId: string) => void;
}


const UserContacts = ({ 
  chats = [], 
  activeChat, 
  error = '', 
  onChatSelect 
}: UserContactsProps) => {
  // Handle both wrapped and unwrapped contacts
  const contacts = Array.isArray(chats) ? chats : chats.contacts || [];

  return (
    <div className="w-80 rounded-3xl overflow-hidden bg-white shadow-md">
      <h2 className="p-4 text-[#8B7355] text-lg font-semibold">
        Messages
      </h2>
      <div className="h-px bg-gray-200" />
      <div className="overflow-auto max-h-[calc(92vh-70px)]">
        {error && (
          <p className="p-4 text-center text-red-600">
            {error}
          </p>
        )}
        {contacts.length > 0 ? (
          contacts.map((contact) => (
            <div key={contact._id}>
              <div 
                onClick={() => onChatSelect(contact._id)}
                className={`
                  flex items-center p-4 cursor-pointer
                  ${activeChat === contact._id ? 'bg-[#8B735514]' : 'bg-transparent'}
                  hover:bg-[#8B735508]
                  transition-colors duration-200
                `}
              >
                <div className="mr-4 relative">
                  <div className="w-10 h-10 rounded-full bg-[#8B7355] text-white flex items-center justify-center">
                    {contact.username[0].toUpperCase()}
                  </div>
                  {contact.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {contact.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900">
                    {contact.username}
                  </p>
                  <div className="flex items-center">
                    <p className="truncate text-sm text-gray-500">
                      {contact.lastMessage?.text || ''}
                    </p>
                    {contact.lastMessage?.timestamp && (
                      <span className="ml-2 text-xs text-gray-400">
                        · {formatTimestamp(contact.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="h-px bg-gray-200" />
            </div>
          ))
        ) : (
          <p className="p-4 text-center text-gray-500">
            No chats yet
          </p>
        )}
      </div>
    </div>
  );
};

export default UserContacts;
