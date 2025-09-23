import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'user' | 'officer';
  name?: string;
  mobile?: string;
  officerId?: string;
}

interface AuthContextType {
  user: User | null;
  sendUserOTP: (mobile: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyUserOTP: (mobile: string, otp: string) => Promise<void>;
  sendOfficerOTP: (officerId: string, password: string) => Promise<{ success: boolean; otp?: string; error?: string }>;
  verifyOfficerOTP: (officerId: string, otp: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    }
    setIsLoading(false);
  }, []);

  const sendUserOTP = async (mobile: string): Promise<{ success: boolean; otp?: string; error?: string }> => {
    if (!mobile) {
      return { success: false, error: 'Mobile number is required' };
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP temporarily (in production, this would be sent via SMS)
    sessionStorage.setItem(`otp_${mobile}`, otp);
    
    return { success: true, otp }; // In production, don't return OTP
  };

  const verifyUserOTP = async (mobile: string, otp: string): Promise<void> => {
    setIsLoading(true);
    try {
      const storedOTP = sessionStorage.getItem(`otp_${mobile}`);
      
      if (storedOTP !== otp) {
        throw new Error('Invalid OTP');
      }

      const user: User = { 
        id: '1', 
        username: mobile, 
        role: 'user', 
        name: 'Demo Borrower',
        mobile 
      };
      
      localStorage.setItem('auth_token', 'demo_user_token');
      localStorage.setItem('user_data', JSON.stringify(user));
      setUser(user);
      
      // Clean up OTP
      sessionStorage.removeItem(`otp_${mobile}`);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOfficerOTP = async (officerId: string, password: string): Promise<{ success: boolean; otp?: string; error?: string }> => {
    if (!officerId || !password) {
      return { success: false, error: 'Officer ID and password are required' };
    }
    
    // Simple validation (in production, validate against database)
    if (officerId !== 'admin' || password !== '1234') {
      return { success: false, error: 'Invalid credentials' };
    }
    
    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store OTP temporarily
    sessionStorage.setItem(`officer_otp_${officerId}`, otp);
    
    return { success: true, otp }; // In production, don't return OTP
  };

  const verifyOfficerOTP = async (officerId: string, otp: string): Promise<void> => {
    setIsLoading(true);
    try {
      const storedOTP = sessionStorage.getItem(`officer_otp_${officerId}`);
      
      if (storedOTP !== otp) {
        throw new Error('Invalid OTP');
      }

      const user: User = { 
        id: '2', 
        username: officerId, 
        role: 'officer', 
        name: 'Demo Officer',
        officerId 
      };
      
      localStorage.setItem('auth_token', 'demo_officer_token');
      localStorage.setItem('user_data', JSON.stringify(user));
      setUser(user);
      
      // Clean up OTP
      sessionStorage.removeItem(`officer_otp_${officerId}`);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, sendUserOTP, verifyUserOTP, sendOfficerOTP, verifyOfficerOTP, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};