import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';

interface User {
  id: number;
  role: number;
  roleId: number;
  platformId: number;
  name: string;
  email?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, empId: number, roleId: number) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up the unauthorized callback for API service
    apiService.setUnauthorizedCallback(() => {
      // Clear user state and redirect to homepage
      setUser(null);
      navigate('/', { replace: true });
    });

    // Check if user is already authenticated on app load
    const currentUser = apiService.getCurrentUser();
    if (currentUser && apiService.isAuthenticated()) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, [navigate]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const result = await apiService.login({ email, password });
      setUser({ 
        id: result.userId,
        role: result.userRole,
        roleId: result.userRole, // Using userRole as roleId for now
        platformId: result.platformId,
        name: result.user,
        email: email,
        token: result.token
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, empId: number, roleId: number): Promise<void> => {
    try {
      setIsLoading(true);
      await apiService.register({ email, password, name, empId, roleId });
      // Registration successful - user needs to login manually
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    apiService.logout();
    setUser(null);
  };

  const value: AuthContextType = useMemo(() => ({
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user && apiService.isAuthenticated(),
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
