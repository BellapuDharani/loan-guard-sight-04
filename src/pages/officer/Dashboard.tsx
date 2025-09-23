import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  TrendingUp,
  Eye,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export const OfficerDashboard: React.FC = () => {
  const [loanSummary, setLoanSummary] = useState<LoanSummary>({
    total: 0,
    pending: 0,
    verified: 0,
    flagged: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading dashboard data
    setTimeout(() => {
      setLoanSummary({
        total: 45,
        pending: 12,
        verified: 28,
        flagged: 5
      });

      setAlerts([
        {
          id: '1',
          type: 'mismatch',
          message: 'Proof mismatch detected for Loan LN-123',
          loanId: 'LN-123',
          timestamp: '2024-09-21T10:30:00Z',
          severity: 'high'
        },
        {
          id: '2',
          type: 'location',
          message: 'GPS location verification failed for Loan LN-124',
          loanId: 'LN-124',
          timestamp: '2024-09-21T09:15:00Z',
          severity: 'medium'
        }
      ]);

      setRecentActivity([
        {
          id: '1',
          type: 'upload',
          description: 'New proof documents uploaded for LN-125',
          timestamp: '2024-09-21T11:00:00Z',
          status: 'success'
        },
        {
          id: '2',
          type: 'verification',
          description: 'AI verification completed for LN-123',
          timestamp: '2024-09-21T10:45:00Z',
          status: 'warning'
        },
        {
          id: '3',
          type: 'decision',
          description: 'Loan LN-122 approved by officer',
          timestamp: '2024-09-21T10:30:00Z',
          status: 'success'
        }
      ]);

      setIsLoading(false);
    }, 1000);
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
                  <p className="text-sm font-medium text-muted-foreground">Total Loans</p>
                  <p className="text-2xl font-bold text-foreground">{loanSummary.total}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
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
                {alerts.map((alert) => (
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
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system activities and decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
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
                ))}
              </div>
            </CardContent>
          </Card>
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
      </div>
    </DashboardLayout>
  );
};