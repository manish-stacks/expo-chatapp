import { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Switch, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { LogOut, Camera, Bell, Moon, Shield, CircleHelp as HelpCircle, Info } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile } from '@/services/userService';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const updateProfilePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUpdatingPhoto(true);
        const photoURL = result.assets[0].uri;
        await updateUserProfile(user.uid, { photoURL });
        setUpdatingPhoto(false);
      }
    } catch (error) {
      console.error('Error updating profile photo:', error);
      setUpdatingPhoto(false);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, you would apply the theme change here
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
    // In a real app, you would update notification settings here
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {updatingPhoto ? (
              <View style={styles.profileImage}>
                <ActivityIndicator color="#5271ff" size="small" />
              </View>
            ) : (
              <Image 
                source={{ uri: user?.photoURL || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop' }} 
                style={styles.profileImage} 
              />
            )}
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={updateProfilePhoto}
              disabled={updatingPhoto}
            >
              <Camera size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.displayName}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Bell size={20} color="#5271ff" />
          </View>
          <Text style={styles.settingText}>Notifications</Text>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#e0e0e0', true: '#bccaff' }}
            thumbColor={notifications ? '#5271ff' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Moon size={20} color="#5271ff" />
          </View>
          <Text style={styles.settingText}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#e0e0e0', true: '#bccaff' }}
            thumbColor={darkMode ? '#5271ff' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Shield size={20} color="#5271ff" />
          </View>
          <Text style={styles.settingText}>Privacy Policy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <HelpCircle size={20} color="#5271ff" />
          </View>
          <Text style={styles.settingText}>Help & Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIconContainer}>
            <Info size={20} color="#5271ff" />
          </View>
          <Text style={styles.settingText}>About</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <LogOut size={20} color="#ff3b30" />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  profileSection: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#5271ff',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  settingsSection: {
    backgroundColor: '#fff',
    marginBottom: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  logoutText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 30,
  },
});