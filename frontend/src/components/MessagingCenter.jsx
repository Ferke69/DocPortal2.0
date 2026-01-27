import React, { useState } from 'react';
import { Send, ArrowLeft, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { mockMessages, mockClients, mockProviders } from '../mockData';
import { toast } from '../hooks/use-toast';

const MessagingCenter = ({ userType, userId, onBack }) => {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [searchQuery, setSearchQuery] = useState('');

  const getConversations = () => {
    const conversations = new Map();
    messages.forEach(msg => {
      const otherUserId = userType === 'provider' 
        ? (msg.senderType === 'client' ? msg.senderId : msg.receiverId)
        : (msg.senderType === 'provider' ? msg.senderId : msg.receiverId);
      
      if (!conversations.has(otherUserId)) {
        const otherUser = userType === 'provider' 
          ? mockClients.find(c => c.id === otherUserId)
          : mockProviders.find(p => p.id === otherUserId);
        
        if (otherUser) {
          conversations.set(otherUserId, {
            user: otherUser,
            lastMessage: msg,
            unreadCount: messages.filter(m => 
              !m.read && 
              m.senderId === otherUserId && 
              ((userType === 'provider' && m.senderType === 'client') || 
               (userType === 'client' && m.senderType === 'provider'))
            ).length
          });
        }
      }
    });
    return Array.from(conversations.values());
  };

  const getConversationMessages = (otherUserId) => {
    return messages.filter(msg => 
      (msg.senderId === otherUserId || msg.receiverId === otherUserId) &&
      (msg.senderId === userId || msg.receiverId === userId)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: userId,
      receiverId: selectedConversation.user.id,
      senderType: userType,
      message: messageText,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
    toast({
      title: "Message sent",
      description: "Your message has been delivered."
    });
  };

  const conversations = getConversations();
  const conversationMessages = selectedConversation ? getConversationMessages(selectedConversation.user.id) : [];

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('');
  };

  const filteredConversations = conversations.filter(conv => 
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">Secure, HIPAA-compliant messaging</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[550px] overflow-y-auto">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.user.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedConversation?.user.id === conv.user.id
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarImage src={conv.user.avatar} alt={conv.user.name} />
                        <AvatarFallback>{getInitials(conv.user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-900 truncate">{conv.user.name}</div>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-blue-500 text-white">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">{conv.lastMessage.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(conv.lastMessage.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredConversations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchQuery ? 'No conversations found' : 'No messages yet'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedConversation.user.avatar} alt={selectedConversation.user.name} />
                      <AvatarFallback>{getInitials(selectedConversation.user.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{selectedConversation.user.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {userType === 'provider' ? 'Client' : selectedConversation.user.specialty}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Messages */}
                  <div className="h-[480px] overflow-y-auto p-6 space-y-4">
                    {conversationMessages.map((msg) => {
                      const isSender = msg.senderId === userId;
                      return (
                        <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg p-4 ${
                            isSender 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-2 ${
                              isSender ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your message... (HIPAA-compliant)"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 min-h-[80px]"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      <Badge variant="outline" className="text-xs">Encrypted</Badge> All messages are HIPAA-compliant and encrypted
                    </p>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MessagingCenter;
