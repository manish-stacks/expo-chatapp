import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// API URL
const API_URL = 'http://192.168.1.39:5000/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, photoUri: string | null) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string, photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to store token securely

const storeToken = async (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('token', token);
  } else {
    await SecureStore.setItemAsync('token', token); 
  }
};


// Helper function to get token

const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('token');
  } else {
    return await SecureStore.getItemAsync('token');
  }
};

// Helper function to remove token
const removeToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('token');
  } else {
    await SecureStore.deleteItemAsync('token');
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Set up axios interceptor for authentication
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      config => {
        if (token) {
          config.headers['x-auth-token'] = token;
        }
        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, [token]);

  // Check for existing token on startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = await getToken();
        
        if (storedToken) {
          setToken(storedToken);
          
          // Get user data
          const res = await axios.get(`${API_URL}/auth/user`, {
            headers: {
              'x-auth-token': storedToken
            }
          });
          
          setUser({
            id: res.data._id,
            email: res.data.email,
            displayName: res.data.displayName,
            photoURL: res.data.photoURL
          });
        }
      } catch (error) {
        console.error('Error loading user:', error);
        await removeToken();
        setToken(null);
        setUser(null);
      } finally {
        setInitialized(true);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      console.log(res)
      const { token, user } = res.data;
      
      await storeToken(token);
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string, photoUri: string | null) => {
    setLoading(true);
    try {
      // If there's a photo, upload it first
      let photoURL = null;
      
      if (photoUri) {
        const formData = new FormData();
        const filename = photoUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('file', {
          uri: photoUri,
          name: filename,
          type
        } as any);
        
        const uploadRes = await axios.post(`${API_URL}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        photoURL = uploadRes.data.url;
      }
      
      // Register user
      const res = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        displayName,
        photoURL
      },{
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const { token, user } = res.data;
      
      await storeToken(token);
      setToken(token);
      setUser(user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await removeToken();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: { displayName?: string, photoURL?: string }) => {
    try {
      if (!user) throw new Error('No authenticated user');
      
      if (data.photoURL && data.photoURL.startsWith('file://')) {
        // Upload new photo
        const formData = new FormData();
        const filename = data.photoURL.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';
        
        formData.append('photo', {
          uri: data.photoURL,
          name: filename,
          type
        } as any);
        
        const res = await axios.put(`${API_URL}/users/photo`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setUser(prev => prev ? { ...prev, photoURL: res.data.photoURL } : null);
      }
      
      if (data.displayName) {
        const res = await axios.put(`${API_URL}/users/profile`, {
          displayName: data.displayName
        });
        
        setUser(prev => prev ? { ...prev, displayName: res.data.displayName } : null);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      loading, 
      initialized, 
      login, 
      register, 
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}