import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/lib/auth";
import { 
  ArrowLeft,
  Send, 
  Image, 
  Phone, 
  Video, 
  MoreVertical,
  Search,
  Plus,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar?: string;
  isGroup: boolean;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  type: 'text' | 'image';
  imageUrl?: string;
}

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const convs = await authService.getUserConversations(user.id);
      const formattedConversations: Conversation[] = convs.map(conv => ({
        id: conv.id,
        name: conv.name,
        lastMessage: conv.lastMessage,
        time: conv.time,
        unread: conv.unread,
        avatar: "/placeholder.svg",
        isGroup: true // For now, treating all as groups
      }));
      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    // TODO: Implement real message loading
    // For now, using dummy data
    const dummyMessages: Message[] = [
      {
        id: "1",
        senderId: "other1",
        senderName: "Alex",
        senderAvatar: "/placeholder.svg",
        content: "Hey everyone! Ready for this weekend's ride?",
        timestamp: "10:30 AM",
        type: "text"
      },
      {
        id: "2",
        senderId: user?.id || "",
        senderName: "You",
        content: "Absolutely! Can't wait to hit those mountain roads.",
        timestamp: "10:32 AM",
        type: "text"
      },
      {
        id: "3",
        senderId: "other2",
        senderName: "Maria",
        senderAvatar: "/placeholder.svg",
        content: "I've checked the weather - should be perfect!",
        timestamp: "10:35 AM",
        type: "text"
      },
      {
        id: "4",
        senderId: "other1",
        senderName: "Alex",
        senderAvatar: "/placeholder.svg",
        content: "Great photos from yesterday!",
        timestamp: "11:15 AM",
        type: "image",
        imageUrl: "/placeholder.svg"
      }
    ];
    setMessages(dummyMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageData: Message = {
      id: Date.now().toString(),
      senderId: user?.id || "",
      senderName: "You",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "text"
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage("");

    // TODO: Implement real message sending
    toast({
      title: "Message sent!",
      description: "Your message has been delivered.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleImageUpload = () => {
    toast({
      title: "Coming Soon",
      description: "Image sharing will be available soon!",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg text-foreground">Loading conversations...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 px-4 h-[calc(100vh-80px)]">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid lg:grid-cols-12 gap-6 h-full">
            
            {/* Conversations Sidebar */}
            <div className="lg:col-span-4 xl:col-span-3">
              <Card className="card-bg border-border h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-primary" />
                      Conversations
                    </CardTitle>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search conversations..." 
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1">
                  <CardContent className="space-y-2 p-3">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationSelect(conversation)}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id 
                            ? 'bg-primary/10 border border-primary/20' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={conversation.avatar} />
                            <AvatarFallback>{conversation.name[0]}</AvatarFallback>
                          </Avatar>
                          {conversation.unread > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                              {conversation.unread}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{conversation.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{conversation.time}</span>
                      </div>
                    ))}
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-8 xl:col-span-9">
              {selectedConversation ? (
                <Card className="card-bg border-border h-full flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="border-b border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button variant="ghost" size="sm" className="lg:hidden">
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={selectedConversation.avatar} />
                          <AvatarFallback>{selectedConversation.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{selectedConversation.name}</h3>
                          <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderId === user?.id ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`flex items-start space-x-2 max-w-[70%] ${
                              message.senderId === user?.id ? 'flex-row-reverse space-x-reverse' : ''
                            }`}
                          >
                            {message.senderId !== user?.id && (
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={message.senderAvatar} />
                                <AvatarFallback>{message.senderName[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`rounded-lg p-3 ${
                                message.senderId === user?.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {message.type === 'image' && message.imageUrl && (
                                <img
                                  src={message.imageUrl}
                                  alt="Shared"
                                  className="w-full max-w-xs rounded-lg mb-2"
                                />
                              )}
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                message.senderId === user?.id 
                                  ? 'text-primary-foreground/70' 
                                  : 'text-muted-foreground'
                              }`}>
                                {message.timestamp}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t border-border p-4">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={handleImageUpload}>
                        <Image className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="card-bg border-border h-full flex items-center justify-center">
                  <div className="text-center">
                    <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                    <p className="text-muted-foreground">Choose a conversation from the sidebar to start chatting</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
