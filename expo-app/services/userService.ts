import axios from 'axios';

// API URL
const API_URL = 'http://192.168.1.15:5000/api';

// Update user profile
export const updateUserProfile = async (userId: string, data: { displayName?: string, photoURL?: string }) => {
  try {
    const { displayName, photoURL } = data;
    
    if (photoURL && photoURL.startsWith('file://')) {
      // Upload new photo
      const formData = new FormData();
      const filename = photoURL.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : 'image';
      
      formData.append('photo', {
        uri: photoURL,
        name: filename,
        type
      } as any);
      
      const res = await axios.put(`${API_URL}/users/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return { photoURL: res.data.photoURL };
    }
    
    if (displayName) {
      const res = await axios.put(`${API_URL}/users/profile`, {
        displayName
      });
      
      return { displayName: res.data.displayName };
    }
    
    return {};
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};