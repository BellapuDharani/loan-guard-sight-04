import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'user' | 'officer';
  name?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string, otp?: string) => Promise<void>;
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

  const login = async (username: string, password?: string, otp?: string) => {
    setIsLoading(true);
    try {
      // Simulate API call for now
      const response = await new Promise<{ user: User; token: string }>((resolve, reject) => {
        setTimeout(() => {
          if (username === 'borrower' && password === 'password') {
            resolve({
              user: { id: '1', username, role: 'user', name: 'Demo Borrower' },
              token: 'demo_user_token'
            });
          } else if (username === 'officer' && password === 'password') {
            resolve({
              user: { id: '2', username, role: 'officer', name: 'Demo Officer' },
              token: 'demo_officer_token'
            });
          } else if (username === '+10000000001' || username === 'borrower') {
            resolve({
              user: { id: '1', username: 'borrower', role: 'user', name: 'Demo Borrower' },
              token: 'demo_user_token'
            });
          } else if (username === '+10000000002' || username === 'officer') {
            resolve({
              user: { id: '2', username: 'officer', role: 'officer', name: 'Demo Officer' },
              token: 'demo_officer_token'
            });
          } else {
            reject(new Error('Invalid credentials'));
          }
        }, 500);
      });

      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      setUser(response.user);
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
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};