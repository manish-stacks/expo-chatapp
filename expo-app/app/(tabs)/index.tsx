import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getRecentChats, subscribeToChats } from '@/services/chatService';
import { formatTimestamp } from '@/utils/dateUtils';
import { MessageSquarePlus } from 'lucide-react-native';

export default function ChatsScreen() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const loadChats = async () => {
      setLoading(true);
      try {
        const recentChats = await getRecentChats(user.id);
        setChats(recentChats);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }

    };

    // loadChats();
    const timeout = setTimeout(() => {
      loadChats();
    }, 300); // Slight delay to ensure user is fully loaded




    // Set up real-time listener for new messages
    const unsubscribe = subscribeToChats(user.id, (updatedChats) => {
      setChats(updatedChats);
    });

    return () => {
      if (unsubscribe) unsubscribe();
      clearTimeout(timeout);
    };
  }, [user?.id]);

  const navigateToChat = (chatId, recipientId, recipientName, recipientPhoto) => {
    router.push({
      pathname: '/chat/[id]',
      params: {
        id: chatId,
        recipientId,
        recipientName,
        recipientPhoto
      }
    });
  };

  const navigateToNewChat = () => {
    router.push('/new-chat');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start chatting with your contacts</Text>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={navigateToNewChat}
          >
            <MessageSquarePlus size={20} color="#fff" />
            <Text style={styles.newChatButtonText}>New Chat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={chats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.chatItem}
                onPress={() => navigateToChat(
                  item.id,
                  item.recipientId,
                  item.recipientName,
                  item.recipientPhoto
                )}
              >
                <Image
                  source={{ uri: item.recipientPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' }}
                  style={styles.avatar}
                />
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>{item.recipientName}</Text>
                    <Text style={styles.chatTime}>{formatTimestamp(item.lastMessageTime)}</Text>
                  </View>
                  <View style={styles.messageContainer}>
                    <Text
                      style={[
                        styles.lastMessage,
                        item.unread && styles.unreadMessage
                      ]}
                      numberOfLines={1}
                    >
                      {item.lastMessageType === 'image'
                        ? '📷 Photo'
                        : item.lastMessageType === 'video'
                          ? '🎥 Video'
                          : item.lastMessage}
                    </Text>
                    {item.unread && <View style={styles.unreadBadge} />}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={navigateToNewChat}
          >
            <MessageSquarePlus size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  newChatButton: {
    backgroundColor: '#5271ff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chatTime: {
    fontSize: 12,
    color: '#888',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: '#333',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5271ff',
    marginLeft: 10,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#5271ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});