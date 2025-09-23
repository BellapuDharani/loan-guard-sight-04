import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  TrendingUp,
  Eye,
  Upload,
  MapPin,
  Camera,
  File,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';

interface LoanSummary {
  total: number;
  pending: number;
  verified: number;
  flagged: number;
}

interface Alert {
  id: string;
  type: 'mismatch' | 'location' | 'quality';
  message: string;
  loanId: string;
  timestamp: string;
  severity: 'high' | 'medium' | 'low';
}

interface RecentActivity {
  id: string;
  type: 'upload' | 'verification' | 'decision';
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface UserFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  userId: string;
  loanId: string;
}

interface UserWithFiles {
  id: string;
  name: string;
  mobile?: string;
  files: UserFile[];
  totalFiles: number;
  lastActivity: Date;
}

export const OfficerDashboard: React.FC = () => {
  const [loanSummary, setLoanSummary] = useState<LoanSummary>({
    total: 0,
    pending: 0,
    verified: 0,
    flagged: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [users, setUsers] = useState<UserWithFiles[]>([]);
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsersWithFiles = () => {
      // Load from the persistent storage that works across user sessions
      const allUploadedFiles = JSON.parse(localStorage.getItem('allUploadedFiles') || '[]');
      
      // Group files by user ID
      const userFileMap = new Map<string, any[]>();
      
      allUploadedFiles.forEach((file: any) => {
        if (!userFileMap.has(file.userId)) {
          userFileMap.set(file.userId, []);
        }
        userFileMap.get(file.userId)?.push(file);
      });

      // Create user objects with their files
      const usersWithFiles: UserWithFiles[] = [];
      userFileMap.forEach((files, userId) => {
        if (files.length > 0 && userId !== 'unknown') {
          const firstFile = files[0];
          usersWithFiles.push({
            id: userId,
            name: firstFile.userName || `User ${userId}`,
            mobile: firstFile.userMobile || undefined,
            files: files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
            totalFiles: files.length,
            lastActivity: new Date(Math.max(...files.map(f => new Date(f.uploadedAt).getTime())))
          });
        }
      });

      setUsers(usersWithFiles);

      // Update loan summary based on actual data
      const totalFiles = allUploadedFiles.length;
      setLoanSummary({
        total: usersWithFiles.length,
        pending: Math.max(0, usersWithFiles.length),
        verified: 0,
        flagged: 0
      });

      // Generate alerts based on actual uploads
      const newAlerts: Alert[] = [];
      if (totalFiles > 0) {
        newAlerts.push({
          id: '1',
          type: 'location',
          message: `${totalFiles} document(s) uploaded by ${usersWithFiles.length} user(s) requiring verification`,
          loanId: 'LN-001',
          timestamp: new Date().toISOString(),
          severity: 'medium'
        });
      }
      setAlerts(newAlerts);

      // Generate recent activity from all files
      const activities: RecentActivity[] = allUploadedFiles
        .slice(-3)
        .reverse()
        .map((file: any, index: number) => ({
          id: (index + 1).toString(),
          type: 'upload' as const,
          description: `${file.name} uploaded by ${file.userName || 'user'}`,
          timestamp: file.uploadedAt || new Date().toISOString(),
          status: 'success' as const
        }));
      setRecentActivity(activities);

      setIsLoading(false);
    };

    loadUsersWithFiles();

    // Refresh data every 5 seconds to catch new uploads
    const interval = setInterval(loadUsersWithFiles, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'status-flagged';
      case 'medium': return 'status-pending';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="w-4 h-4" />;
      case 'verification': return <Eye className="w-4 h-4" />;
      case 'decision': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const viewFile = (file: UserFile) => {
    setSelectedFile(file);
    setViewDialogOpen(true);
  };

  const downloadFile = (file: UserFile) => {
    window.open(file.url, '_blank');
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Officer Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor loan verifications and manage approval workflows
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate('/officer/verification')}>
              <Eye className="w-4 h-4 mr-2" />
              Review Queue
            </Button>
            <Button onClick={() => navigate('/officer/loans')} className="btn-primary">
              <FileText className="w-4 h-4 mr-2" />
              Manage Loans
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">{loanSummary.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-warning">{loanSummary.pending}</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-success">{loanSummary.verified}</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Flagged</p>
                  <p className="text-2xl font-bold text-destructive">{loanSummary.flagged}</p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users with Uploaded Files */}
          <Card className="card-elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Users & Documents</CardTitle>
                  <CardDescription>Users who have uploaded verification documents</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/officer/verification')}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No users have uploaded documents yet</p>
                    <p className="text-sm mt-2">Documents will appear here once users start uploading</p>
                  </div>
                ) : (
                  users.slice(0, 3).map((user) => (
                    <div key={user.id} className="space-y-3 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          {user.mobile && (
                            <p className="text-sm text-muted-foreground">{user.mobile}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{user.totalFiles} files</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {user.lastActivity.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {user.files.slice(0, 2).map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2 bg-background rounded">
                            <div className="flex items-center gap-2">
                              {file.type.startsWith('image/') ? (
                                <Camera className="w-4 h-4 text-primary" />
                              ) : (
                                <File className="w-4 h-4 text-primary" />
                              )}
                              <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                              {file.location && (
                                <Badge variant="outline" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  GPS
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewFile(file)}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadFile(file)}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {user.files.length > 2 && (
                          <p className="text-xs text-muted-foreground text-center">
                            +{user.files.length - 2} more files
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Alerts & Recent Activity */}
          <div className="space-y-6">
            {/* Alerts */}
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Priority Alerts</CardTitle>
                    <CardDescription>Issues requiring immediate attention</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate('/officer/alerts')}>
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No alerts at this time</p>
                    </div>
                  ) : (
                    alerts.map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{alert.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`status-badge ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Review
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${getActivityColor(activity.status)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="card-hero">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-16 flex-col gap-2"
                onClick={() => navigate('/officer/verification')}
              >
                <Eye className="w-5 h-5" />
                Review Proofs
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2"
                onClick={() => navigate('/officer/loans')}
              >
                <Users className="w-5 h-5" />
                Loan Management
              </Button>
              <Button
                variant="outline"
                className="h-16 flex-col gap-2"
                onClick={() => navigate('/officer/analytics')}
              >
                <TrendingUp className="w-5 h-5" />
                Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* File View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{selectedFile?.name}</DialogTitle>
            </DialogHeader>
            {selectedFile && (
              <div className="space-y-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span>Uploaded: {new Date(selectedFile.uploadedAt).toLocaleString()}</span>
                  {selectedFile.location && (
                    <span>GPS: {selectedFile.location.latitude.toFixed(4)}, {selectedFile.location.longitude.toFixed(4)}</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {selectedFile.type.startsWith('image/') ? (
                    <img 
                      src={selectedFile.url} 
                      alt={selectedFile.name}
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <File className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Preview not available for this file type</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => window.open(selectedFile.url, '_blank')}
                        >
                          Download File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};