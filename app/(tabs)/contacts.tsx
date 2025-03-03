import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getAllUsers, createChat } from '@/services/chatService';
import { Search, UserPlus, Check } from 'lucide-react-native';

export default function ContactsScreen() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingContact, setAddingContact] = useState({});

  useEffect(() => {
    const loadContacts = async () => {
      if (user) {
        try {
          const users = await getAllUsers(user.uid);
          setContacts(users);
          setFilteredContacts(users);
        } catch (error) {
          console.error('Error loading contacts:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadContacts();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        contact.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const startChat = async (contactId, contactName, contactPhoto) => {
    try {
      setAddingContact(prev => ({ ...prev, [contactId]: true }));
      const chatId = await createChat(user.uid, contactId);
      router.push({
        pathname: '/chat/[id]',
        params: { 
          id: chatId, 
          recipientId: contactId, 
          recipientName: contactName, 
          recipientPhoto: contactPhoto 
        }
      });
    } catch (error) {
      console.error('Error starting chat:', error);
    } finally {
      setAddingContact(prev => ({ ...prev, [contactId]: false }));
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5271ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {filteredContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No contacts found</Text>
          {searchQuery ? (
            <Text style={styles.emptySubtext}>Try a different search term</Text>
          ) : (
            <Text style={styles.emptySubtext}>You'll see other users here</Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => startChat(item.id, item.displayName, item.photoURL)}
            >
              <Image 
                source={{ uri: item.photoURL || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' }} 
                style={styles.avatar} 
              />
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.displayName}</Text>
                <Text style={styles.contactEmail}>{item.email}</Text>
              </View>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => startChat(item.id, item.displayName, item.photoURL)}
                disabled={addingContact[item.id]}
              >
                {addingContact[item.id] ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  item.hasChat ? (
                    <Check size={20} color="#fff" />
                  ) : (
                    <UserPlus size={20} color="#fff" />
                  )
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5271ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});