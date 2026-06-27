import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../api/services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // 🔥 FIX: Cek user tapi jangan auto set jika tidak ada profile
        const userData = await authService.getCurrentUser();
        
        // Cek apakah user punya profile lengkap
        if (userData && userData.name && userData.name !== 'User') {
          console.log('✅ User terdeteksi:', userData.name);
          setUser(userData);
        } else if (userData) {
          // User ada tapi profile tidak lengkap
          console.warn('⚠️ User login tapi profile tidak lengkap:', userData);
          // Set user tetap, nanti di redirect ke login
          setUser(null);
          // Hapus session biar gak auto login
          await authService.logout();
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
        // Hapus session yang bermasalah
        try {
          await authService.logout();
        } catch (e) {
          console.warn('Logout error:', e);
        }
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      const result = await authService.login(email, password);
      
      // Pastikan user punya profile
      if (result?.user && result.user.name && result.user.name !== 'User') {
        setUser(result.user);
        toast.success(`✅ Selamat datang, ${result.user.name}!`);
        return result;
      } else {
        toast.error('Profile tidak ditemukan, hubungi admin');
        throw new Error('Profile tidak ditemukan');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login gagal');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success('✅ Logout berhasil');
    } catch (error) {
      toast.error('Logout gagal');
      throw error;
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updated = await authService.updateProfile(user?.id, updates);
      setUser({ ...user, ...updated });
      toast.success('Profil berhasil diperbarui');
      return updated;
    } catch (error) {
      toast.error('Gagal memperbarui profil');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};