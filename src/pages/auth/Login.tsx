import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Phone, Lock, User, UserCheck, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ProfileCreationDialog } from '@/components/ProfileCreationDialog';

export const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'user' | 'officer'>('user');
  const [darkMode, setDarkMode] = useState(false);
  
  // User states
  const [mobile, setMobile] = useState('');
  const [userOTP, setUserOTP] = useState('');
  const [showUserOTP, setShowUserOTP] = useState(false);
  const [generatedUserOTP, setGeneratedUserOTP] = useState('');
  
  // Officer states
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [officerOTP, setOfficerOTP] = useState('');
  const [showOfficerOTP, setShowOfficerOTP] = useState(false);
  const [generatedOfficerOTP, setGeneratedOfficerOTP] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const { user, sendUserOTP, verifyUserOTP, sendOfficerOTP, verifyOfficerOTP, needsProfile, currentMobile } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to={user.role === 'officer' ? '/officer/dashboard' : '/dashboard'} replace />;
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleSendUserOTP = async () => {
    if (!mobile) {
      toast({
        title: 'Error',
        description: 'Please enter your mobile number',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendUserOTP(mobile);
      if (result.success && result.otp) {
        setGeneratedUserOTP(result.otp);
        setShowUserOTP(true);
        toast({
          title: 'OTP Sent',
          description: `Demo OTP: ${result.otp}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyUserOTP = async () => {
    if (!userOTP) {
      toast({
        title: 'Error',
        description: 'Please enter the OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await verifyUserOTP(mobile, userOTP);
      if (!needsProfile) {
        toast({
          title: 'Login Successful',
          description: 'Welcome back to LoanTrack Pro!',
        });
      }
    } catch (error) {
      toast({
        title: 'Invalid OTP',
        description: 'Please check your OTP and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileCreated = async (profile: any) => {
    setIsLoading(true);
    try {
      await verifyUserOTP(currentMobile!, userOTP, profile);
      toast({
        title: 'Login Successful',
        description: 'Welcome to LoanTrack Pro!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOfficerOTP = async () => {
    if (!officerId || !password) {
      toast({
        title: 'Error',
        description: 'Please enter Officer ID and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOfficerOTP(officerId, password);
      if (result.success && result.otp) {
        setGeneratedOfficerOTP(result.otp);
        setShowOfficerOTP(true);
        toast({
          title: 'OTP Sent',
          description: `Demo OTP: ${result.otp}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOfficerOTP = async () => {
    if (!officerOTP) {
      toast({
        title: 'Error',
        description: 'Please enter the OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await verifyOfficerOTP(officerId, officerOTP);
      toast({
        title: 'Login Successful',
        description: 'Welcome Officer!',
      });
    } catch (error) {
      toast({
        title: 'Invalid OTP',
        description: 'Please check your OTP and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header with Dark Mode Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">LoanTrack Pro Demo</h1>
            <p className="text-muted-foreground mt-2">
              AI-powered loan verification system
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleDarkMode}
            className="absolute top-4 right-4"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>

        {/* Auth Tabs */}
        <div className="flex mb-6 bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'user' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('user')}
            className="flex-1"
          >
            <User className="w-4 h-4 mr-2" />
            User Login
          </Button>
          <Button
            variant={activeTab === 'officer' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('officer')}
            className="flex-1"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Officer Login
          </Button>
        </div>

        {/* User Login Form */}
        {activeTab === 'user' && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>User Login</CardTitle>
              <CardDescription>
                Enter your mobile number to receive OTP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-10"
                    disabled={showUserOTP}
                  />
                </div>
              </div>

              {!showUserOTP ? (
                <Button
                  onClick={handleSendUserOTP}
                  className="w-full btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Enter OTP</label>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={userOTP}
                      onChange={(e) => setUserOTP(e.target.value)}
                      maxLength={6}
                    />
                    {generatedUserOTP && (
                      <Badge variant="outline" className="text-xs">
                        Demo OTP: {generatedUserOTP}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleVerifyUserOTP}
                    className="w-full btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Officer Login Form */}
        {activeTab === 'officer' && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Officer Login</CardTitle>
              <CardDescription>
                Enter your credentials to access officer dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Officer ID</label>
                <Input
                  type="text"
                  placeholder="Enter Officer ID (e.g., admin)"
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  disabled={showOfficerOTP}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter Password (e.g., 1234)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={showOfficerOTP}
                  />
                </div>
              </div>

              {!showOfficerOTP ? (
                <Button
                  onClick={handleSendOfficerOTP}
                  className="w-full btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Enter OTP</label>
                    <Input
                      type="text"
                      placeholder="Enter 4-digit OTP"
                      value={officerOTP}
                      onChange={(e) => setOfficerOTP(e.target.value)}
                      maxLength={4}
                    />
                    {generatedOfficerOTP && (
                      <Badge variant="outline" className="text-xs">
                        Demo OTP: {generatedOfficerOTP}
                      </Badge>
                    )}
                  </div>
                  <Button
                    onClick={handleVerifyOfficerOTP}
                    className="w-full btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Powered by AI • Google APIs • Secure Verification</p>
        </div>
      </div>

      {/* Profile Creation Dialog */}
      <ProfileCreationDialog
        open={needsProfile}
        onClose={() => {}}
        mobile={currentMobile || ''}
        onProfileCreated={handleProfileCreated}
      />
    </div>
  );
};