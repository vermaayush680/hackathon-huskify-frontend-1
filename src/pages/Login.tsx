import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Lock, User, UserPlus, Building2 } from 'lucide-react';
import { getCurrentPlatform } from '@/utils/platform';

const Login: React.FC = () => {
  const { login, register, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPlatform, setCurrentPlatform] = useState<string>('');
  
  // Get current platform from URL and redirect to homepage if none selected
  useEffect(() => {
    const platform = getCurrentPlatform();
    if (!platform) {
      // No platform selected, redirect to homepage
      navigate('/', { replace: true });
      return;
    }
    setCurrentPlatform(platform);
  }, [navigate]);
  
  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user && currentPlatform) {
      // User is authenticated and we have a platform, redirect to dashboard
      navigate(`/${currentPlatform}`, { replace: true });
    }
  }, [user, currentPlatform, navigate]);
  
  // Clear messages when switching tabs
  useEffect(() => {
    setError('');
    setSuccessMessage('');
  }, [activeTab]);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    name: '',
    empId: '',
    roleId: '',
  });

  // Validation functions to check if forms are complete
  const isLoginFormValid = () => {
    return loginData.email.trim() !== '' && loginData.password.trim() !== '';
  };

  const isRegisterFormValid = () => {
    return (
      registerData.email.trim() !== '' &&
      registerData.password.trim() !== '' &&
      registerData.name.trim() !== '' &&
      registerData.empId.trim() !== '' &&
      registerData.roleId.trim() !== ''
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSuccessMessage('');

    if (!loginData.email || !loginData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(loginData.email, loginData.password);
      // Success: Set success message and redirect
      setSuccessMessage('Login successful! Redirecting to dashboard...');
      
      // Explicit redirect as backup (in case useEffect doesn't trigger immediately)
      setTimeout(() => {
        if (currentPlatform) {
          navigate(`/${currentPlatform}`, { replace: true });
        }
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      // Stay on login form when login fails - do not reload or redirect
      console.error('Login error:', err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');
    setSuccessMessage('');

    if (!registerData.email || !registerData.password || !registerData.name || !registerData.empId || !registerData.roleId) {
      setError('Please fill in all fields');
      return;
    }

    const empIdNum = parseInt(registerData.empId);
    if (isNaN(empIdNum) || empIdNum.toString().length < 7) {
      setError('Employee ID must be a valid number with at least 7 digits');
      return;
    }

    try {
      let response = await register(registerData.email, registerData.password, registerData.name, empIdNum, parseInt(registerData.roleId));
      console.log('Registration response:', response);
      // Success: Set success message and redirect
      setSuccessMessage('Registration successful! Logging you in...');
      
      // Explicit redirect as backup (in case useEffect doesn't trigger immediately)
      setTimeout(() => {
        if (currentPlatform) {
          navigate(`/${currentPlatform}`, { replace: true });
        }
      }, 1500);
    } catch (err: any) {
      setActiveTab('register');
      setError(err.message || 'Registration failed');
      // Stay on the register tab when signup fails - do not reload or redirect
      console.error('Registration error:', err);
      // Ensure we stay on register tab
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Husky Demand Portal</h1>
          <p className="text-gray-600 mb-2">Welcome to the workforce management system</p>
          {currentPlatform && (
            <div className="flex flex-col items-center space-y-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Platform: {currentPlatform}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                ← Back to Platform Selection
              </Button>
            </div>
          )}
        </div>

        <Card className="shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Sign In
                </CardTitle>
                <CardDescription>
                  Enter your credentials to access the portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email *</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password *</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {successMessage && (
                    <Alert className="border-green-200 text-green-800 bg-green-50">
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading || !isLoginFormValid()}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="register">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Create Account
                </CardTitle>
                <CardDescription>
                  Register for a new account to access the portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name *</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-empId">Employee ID *</Label>
                    <Input
                      id="register-empId"
                      type="number"
                      placeholder="Enter your employee ID"
                      value={registerData.empId}
                      onChange={(e) => setRegisterData({ ...registerData, empId: e.target.value })}
                      disabled={isLoading}
                      min="1000000"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password *</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-role">Role *</Label>
                    <Select
                      value={registerData.roleId}
                      onValueChange={(value) => setRegisterData({ ...registerData, roleId: value })}
                      disabled={isLoading}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">User</SelectItem>
                        <SelectItem value="3">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {successMessage && (
                    <Alert className="border-green-200 text-green-800 bg-green-50">
                      <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading || !isRegisterFormValid()}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <User className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Demo credentials:</p>
          <p>Email: admin@example.com | Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
