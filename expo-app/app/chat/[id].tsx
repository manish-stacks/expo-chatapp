import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getMessages, sendMessage, markChatAsRead } from '@/services/chatService';
import { formatTimestamp } from '@/utils/dateUtils';
import { ArrowLeft, Send, Image as ImageIcon, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ChatScreen() {
  const { id, recipientId, recipientName, recipientPhoto } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!user || !id) return;

    const loadMessages = async () => {
      try {
        const chatMessages = await getMessages(id.toString());
        setMessages(chatMessages);
        
        // Mark chat as read
        await markChatAsRead(id.toString(), user.uid);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Set up real-time listener for new messages
    const unsubscribe = subscribeToMessages(id.toString(), (updatedMessages) => {
      setMessages(updatedMessages);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id, user]);

  const handleSend = async () => {
    if (!text.trim()) return;
    
    try {
      setSending(true);
      await sendMessage(id.toString(), user.uid, recipientId.toString(), text, 'text');
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingMedia(true);
        const imageUri = result.assets[0].uri;
        await sendMessage(id.toString(), user.uid, recipientId.toString(), imageUri, 'image');
        setUploadingMedia(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setUploadingMedia(false);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingMedia(true);
        const videoUri = result.assets[0].uri;
        await sendMessage(id.toString(), user.uid, recipientId.toString(), videoUri, 'video');
        setUploadingMedia(false);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      setUploadingMedia(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isMyMessage = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMyMessage && (
          <Image 
            source={{ uri: recipientPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' }} 
            style={styles.messageAvatar} 
          />
        )}
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble,
          item.type !== 'text' && styles.mediaBubble
        ]}>
          {item.type === 'image' ? (
            <Image 
              source={{ uri: item.content }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : item.type === 'video' ? (
            <View style={styles.videoContainer}>
              <Image 
                source={{ uri: item.thumbnail || 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=200&auto=format&fit=crop' }} 
                style={styles.messageVideo}
                resizeMode="cover"
              />
              <View style={styles.videoPlayButton}>
                <Video size={24} color="#fff" />
              </View>
            </View>
          ) : (
            <Text style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText
            ]}>
              {item.content}
            </Text>
          )}
          <Text style={[
            styles.messageTime,
            isMyMessage ? styles.myMessageTime : styles.theirMessageTime
          ]}>
            {formatTimestamp(item.timestamp, 'time')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Image 
          source={{ uri: recipientPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' }} 
          style={styles.headerAvatar} 
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{recipientName}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5271ff" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          inverted
          onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0 })}
        />
      )}

      {uploadingMedia && (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.uploadingText}>Uploading media...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <View style={styles.mediaButtons}>
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={pickImage}
              disabled={uploadingMedia}
            >
              <ImageIcon size={20} color="#5271ff" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.mediaButton}
              onPress={pickVideo}
              disabled={uploadingMedia}
            >
              <Video size={20} color="#5271ff" />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4caf50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  mediaBubble: {
    padding: 3,
    borderRadius: 15,
    overflow: 'hidden',
  },
  myMessageBubble: {
    backgroundColor: '#5271ff',
  },
  theirMessageBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirMessageTime: {
    color: '#888',
  },
  messageImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
  },
  videoContainer: {
    position: 'relative',
  },
  messageVideo: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
  },
  videoPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  uploadingContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginLeft: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  mediaButtons: {
    flexDirection: 'row',
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    marginRight: 5,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5271ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#bccaff',
  },
});