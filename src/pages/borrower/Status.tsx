import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertTriangle, MapPin, Calendar, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface LoanStatus {
  loanId: string;
  borrowerName: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'verified' | 'flagged';
  proofs: ProofDocument[];
  lastComparison?: ComparisonResult;
}

interface ProofDocument {
  id: string;
  filename: string;
  uploadDate: string;
  gpsLocation: { lat: number; lng: number };
  status: 'pending' | 'verified' | 'flagged';
}

interface ComparisonResult {
  match: boolean;
  confidence: number;
  geoValid: boolean;
  notes: string;
  timestamp: string;
}

export const Status: React.FC = () => {
  const [searchParams] = useSearchParams();
  const loanId = searchParams.get('loan_id') || 'LN-123';
  const [loanStatus, setLoanStatus] = useState<LoanStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching loan status
    setTimeout(() => {
      setLoanStatus({
        loanId: loanId,
        borrowerName: 'Demo Borrower',
        amount: 50000,
        dueDate: '2024-12-15',
        status: 'pending',
        proofs: [
          {
            id: 'proof-1',
            filename: 'invoice_001.pdf',
            uploadDate: '2024-09-20T10:30:00Z',
            gpsLocation: { lat: 40.7128, lng: -74.0060 },
            status: 'verified'
          },
          {
            id: 'proof-2',
            filename: 'receipt_002.jpg',
            uploadDate: '2024-09-21T14:15:00Z',
            gpsLocation: { lat: 40.7589, lng: -73.9851 },
            status: 'pending'
          }
        ],
        lastComparison: {
          match: true,
          confidence: 85,
          geoValid: true,
          notes: 'Document content matches reference files. GPS location verified within expected area.',
          timestamp: '2024-09-21T15:00:00Z'
        }
      });
      setIsLoading(false);
    }, 1000);
  }, [loanId]);

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!loanStatus) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">Loan not found</h2>
          <p className="text-muted-foreground">The requested loan could not be found.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Verification Status</h1>
          <p className="text-muted-foreground mt-1">
            Track the verification progress of your loan documents
          </p>
        </div>

        {/* Loan Overview */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Loan {loanStatus.loanId}</CardTitle>
                  <CardDescription>Amount: ${loanStatus.amount.toLocaleString()}</CardDescription>
                </div>
              </div>
              <Badge className={`status-badge ${getStatusColor(loanStatus.status)}`}>
                {getStatusIcon(loanStatus.status)}
                <span className="ml-1 capitalize">{loanStatus.status}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Borrower</p>
                  <p className="font-medium text-foreground">{loanStatus.borrowerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(loanStatus.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Proofs Uploaded</p>
                  <p className="font-medium text-foreground">{loanStatus.proofs.length}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Verification Results */}
        {loanStatus.lastComparison && (
          <Card className="card-hero">
            <CardHeader>
              <CardTitle>AI Verification Results</CardTitle>
              <CardDescription>Latest automated verification analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="text-center p-4 bg-card rounded-lg">
                  <div className={`text-2xl font-bold ${loanStatus.lastComparison.match ? 'text-success' : 'text-destructive'}`}>
                    {loanStatus.lastComparison.match ? 'MATCH' : 'NO MATCH'}
                  </div>
                  <div className="text-sm text-muted-foreground">Document Comparison</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg">
                  <div className={`text-2xl font-bold ${getConfidenceColor(loanStatus.lastComparison.confidence)}`}>
                    {loanStatus.lastComparison.confidence}%
                  </div>
                  <div className="text-sm text-muted-foreground">Confidence Score</div>
                </div>
                <div className="text-center p-4 bg-card rounded-lg">
                  <div className={`text-2xl font-bold ${loanStatus.lastComparison.geoValid ? 'text-success' : 'text-destructive'}`}>
                    {loanStatus.lastComparison.geoValid ? 'VALID' : 'INVALID'}
                  </div>
                  <div className="text-sm text-muted-foreground">GPS Verification</div>
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Analysis Notes</h4>
                <p className="text-sm text-muted-foreground">{loanStatus.lastComparison.notes}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(loanStatus.lastComparison.timestamp).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Uploaded Documents */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>All proof documents submitted for this loan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loanStatus.proofs.map((proof) => (
                <div key={proof.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{proof.filename}</h4>
                      <Badge className={`status-badge ${getStatusColor(proof.status)}`}>
                        {getStatusIcon(proof.status)}
                        <span className="ml-1 capitalize">{proof.status}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Uploaded: {new Date(proof.uploadDate).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        GPS: {proof.gpsLocation.lat.toFixed(4)}, {proof.gpsLocation.lng.toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-primary">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loanStatus.status === 'pending' && (
                <p className="text-sm text-foreground">
                  • Your documents are being reviewed by our loan officer
                </p>
              )}
              <p className="text-sm text-foreground">
                • You will be notified via SMS when verification is complete
              </p>
              <p className="text-sm text-foreground">
                • Check this page regularly for status updates
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};