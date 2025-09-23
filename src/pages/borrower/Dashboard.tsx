import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, FileText, Clock, CheckCircle, AlertTriangle, Camera, MapPin, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

interface Loan {
  id: string;
  amount: number;
  status: 'pending' | 'verified' | 'flagged';
  dueDate: string;
  borrowerName: string;
  proofCount: number;
  lastUpdate: string;
}

export const BorrowerDashboard: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Simulate fetching borrower's loans
    setTimeout(() => {
      setLoans([
        {
          id: 'LN-123',
          amount: 50000,
          status: 'pending',
          dueDate: '2024-12-15',
          borrowerName: user?.name || 'Demo Borrower',
          proofCount: 2,
          lastUpdate: '2024-09-20'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'flagged': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'status-verified';
      case 'flagged': return 'status-flagged';
      default: return 'status-pending';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-32 bg-muted rounded"></div>
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
            <h1 className="text-3xl font-bold text-foreground">My Loans</h1>
            <p className="text-muted-foreground mt-1">
              Track your loan verification status and upload proof documents
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Loan
            </Button>
            <Button 
              onClick={() => navigate('/upload')}
              className="btn-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Proof
            </Button>
          </div>
        </div>

        {/* Loans Grid */}
        <div className="grid gap-6">
          {loans.map((loan) => (
            <Card key={loan.id} className="card-elevated hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Loan {loan.id}</CardTitle>
                      <CardDescription>
                        Amount: ${loan.amount.toLocaleString()} • Due: {new Date(loan.dueDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`status-badge ${getStatusColor(loan.status)}`}>
                    {getStatusIcon(loan.status)}
                    <span className="ml-1 capitalize">{loan.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{loan.proofCount}</div>
                    <div className="text-sm text-muted-foreground">Proofs Uploaded</div>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Last Updated</div>
                    <div className="text-sm font-medium text-foreground">
                      {new Date(loan.lastUpdate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex justify-center items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/status?loan_id=${loan.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload Guidelines */}
        <Card className="card-hero">
          <CardHeader>
            <CardTitle>Upload Proof Documents</CardTitle>
            <CardDescription>
              Follow these guidelines to ensure successful verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="guideline-card">
                <Camera className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Clear Photos</h3>
                <p className="text-sm text-muted-foreground">
                  Take clear, well-lit photos of invoices and receipts. Ensure all text is readable.
                </p>
              </div>
              <div className="guideline-card">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">GPS Location</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure GPS is enabled to verify the location where proof was captured.
                </p>
              </div>
              <div className="guideline-card">
                <FileCheck className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Valid Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Upload original invoices, receipts, or purchase orders related to your loan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};