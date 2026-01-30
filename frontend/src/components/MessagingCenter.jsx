import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi, providerApi, clientApi } from '../services/api';
import { toast } from '../hooks/use-toast';
import ThemeToggle from './ThemeToggle';

const MessagingCenter = ({ userType, userId, onBack }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch messages
      const messagesRes = await messagesApi.getAll();
      setMessages(messagesRes.data || []);

      // Fetch contacts (clients for providers, provider for clients)
      if (userType === 'provider') {
        const clientsRes = await providerApi.getClients();
        setContacts(clientsRes.data || []);
      } else {
        try {
          const providerRes = await clientApi.getProvider();
          setContacts(providerRes.data ? [providerRes.data] : []);
        } catch (err) {
          setContacts([]);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getConversations = () => {
    const conversations = new Map();
    
    // Group messages by conversation partner
    messages.forEach(msg => {
      const otherUserId = msg.senderId === user?.user_id ? msg.receiverId : msg.senderId;
      
      if (!conversations.has(otherUserId)) {
        const contact = contacts.find(c => c.user_id === otherUserId);
        conversations.set(otherUserId, {
          id: otherUserId,
          user: contact || { user_id: otherUserId, name: 'Unknown User' },
          messages: [],
          unreadCount: 0
        });
      }
      
      const conv = conversations.get(otherUserId);
      conv.messages.push(msg);
      if (!msg.read && msg.receiverId === user?.user_id) {
        conv.unreadCount++;
      }
    });

    // Add contacts without messages
    contacts.forEach(contact => {
      if (!conversations.has(contact.user_id)) {
        conversations.set(contact.user_id, {
          id: contact.user_id,
          user: contact,
          messages: [],
          unreadCount: 0
        });
      }
    });

    return Array.from(conversations.values()).sort((a, b) => {
      const aTime = a.messages[a.messages.length - 1]?.timestamp || 0;
      const bTime = b.messages[b.messages.length - 1]?.timestamp || 0;
      return new Date(bTime) - new Date(aTime);
    });
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      setSending(true);
      const messageData = {
        senderId: user?.user_id,
        receiverId: selectedConversation.id,
        senderType: userType,
        message: messageText.trim()
      };

      const response = await messagesApi.send(messageData);
      
      // Add message to local state
      const newMessage = {
        ...messageData,
        _id: response.data.id,
        timestamp: response.data.timestamp,
        read: false
      };
      
      setMessages([...messages, newMessage]);
      setMessageText('');
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered."
      });
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const conversations = getConversations();
  const filteredConversations = conversations.filter(conv => 
    conv.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const conversationMessages = selectedConversation 
    ? messages.filter(msg => 
        (msg.senderId === selectedConversation.id || msg.receiverId === selectedConversation.id) &&
        (msg.senderId === user?.user_id || msg.receiverId === user?.user_id)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={onBack} className="mb-4 dark:text-gray-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Secure messaging with your healthcare provider</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Conversations</CardTitle>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[550px] overflow-y-auto">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedConversation?.id === conv.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar>
                        <AvatarImage src={conv.user?.avatar} alt={conv.user?.name} />
                        <AvatarFallback>{getInitials(conv.user?.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">{conv.user?.name}</div>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-blue-500 text-white">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        {conv.messages.length > 0 && (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-300 truncate mt-1">
                              {conv.messages[conv.messages.length - 1]?.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(conv.messages[conv.messages.length - 1]?.timestamp).toLocaleString()}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredConversations.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Thread */}
          <Card className="lg:col-span-2 dark:bg-gray-800 dark:border-gray-700">
            {selectedConversation ? (
              <>
                <CardHeader className="border-b dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={selectedConversation.user?.avatar} alt={selectedConversation.user?.name} />
                      <AvatarFallback>{getInitials(selectedConversation.user?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="dark:text-white">{selectedConversation.user?.name}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userType === 'provider' ? 'Client' : selectedConversation.user?.specialty || 'Provider'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Messages */}
                  <div className="h-[480px] overflow-y-auto p-6 space-y-4">
                    {conversationMessages.map((msg) => {
                      const isSender = msg.senderId === user?.user_id;
                      return (
                        <div key={msg._id || msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg p-4 ${
                            isSender 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}>
                            <p className="text-sm">{msg.message}</p>
                            <p className={`text-xs mt-2 ${
                              isSender ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
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
                    {conversationMessages.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No messages yet. Start the conversation!
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="border-t dark:border-gray-700 p-4">
                    <div className="flex space-x-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="flex-1 min-h-[80px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <Badge variant="outline" className="text-xs dark:border-gray-600">Encrypted</Badge> All messages are securely encrypted
                    </p>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
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
