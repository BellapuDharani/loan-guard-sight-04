import React, { useState } from 'react';
import { Upload, FileText, Plus, Download, Table, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

interface LoanData {
  loanNumber: string;
  beneficiaryName: string;
  beneficiaryPhone: string;
  beneficiaryEmail: string;
  loanAmount: number;
  bankName: string;
  branchName: string;
  purpose: string;
  sanctionedDate: string;
  status: 'pending' | 'approved' | 'disbursed' | 'closed';
}

export const LoanManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('manual');
  const [formData, setFormData] = useState<LoanData>({
    loanNumber: '',
    beneficiaryName: '',
    beneficiaryPhone: '',
    beneficiaryEmail: '',
    loanAmount: 0,
    bankName: '',
    branchName: '',
    purpose: '',
    sanctionedDate: '',
    status: 'pending'
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof LoanData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.loanNumber || !formData.beneficiaryName || !formData.beneficiaryPhone || !formData.loanAmount || !formData.bankName) {
        throw new Error('Please fill in all required fields');
      }

      // Create beneficiary user profile
      const beneficiaryProfile = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        mobile: formData.beneficiaryPhone,
        name: formData.beneficiaryName,
        loanId: formData.loanNumber,
        email: formData.beneficiaryEmail,
        createdAt: new Date().toISOString()
      };

      // Save to localStorage (in production, this would go to Supabase)
      const existingProfiles = JSON.parse(localStorage.getItem('userProfiles') || '[]');
      
      // Check if user already exists
      const existingUser = existingProfiles.find((p: any) => p.mobile === formData.beneficiaryPhone);
      if (existingUser) {
        throw new Error('A user with this phone number already exists');
      }

      existingProfiles.push(beneficiaryProfile);
      localStorage.setItem('userProfiles', JSON.stringify(existingProfiles));

      // Save loan data
      const loanData = {
        id: `loan_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        ...formData,
        beneficiaryId: beneficiaryProfile.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const existingLoans = JSON.parse(localStorage.getItem('loanData') || '[]');
      existingLoans.push(loanData);
      localStorage.setItem('loanData', JSON.stringify(existingLoans));

      toast({
        title: 'Loan Created Successfully',
        description: `Loan ${formData.loanNumber} has been created for ${formData.beneficiaryName}`,
      });

      // Reset form
      setFormData({
        loanNumber: '',
        beneficiaryName: '',
        beneficiaryPhone: '',
        beneficiaryEmail: '',
        loanAmount: 0,
        bankName: '',
        branchName: '',
        purpose: '',
        sanctionedDate: '',
        status: 'pending'
      });

    } catch (error) {
      console.error('Error creating loan:', error);
      toast({
        title: 'Error Creating Loan',
        description: error instanceof Error ? error.message : 'Failed to create loan',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = [
      'loan_number,beneficiary_name,beneficiary_phone,beneficiary_email,loan_amount,bank_name,branch_name,purpose,sanctioned_date,status'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'loan_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded successfully',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loan Management</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage loan information for beneficiaries
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Upload Loan Information</CardTitle>
            <CardDescription>
              Choose your preferred method to add loan data to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Manual Entry
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <Table className="w-4 h-4" />
                  Bulk Upload
                </TabsTrigger>
                <TabsTrigger value="pdf" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF Extract
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  API Integration
                </TabsTrigger>
              </TabsList>

              {/* Manual Entry Tab */}
              <TabsContent value="manual" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Single Loan Entry</h3>
                  <p className="text-muted-foreground">
                    Enter loan details manually for individual beneficiaries
                  </p>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Loan Details */}
                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-foreground">Loan Information</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="loanNumber">Loan Number *</Label>
                        <Input
                          id="loanNumber"
                          value={formData.loanNumber}
                          onChange={(e) => handleInputChange('loanNumber', e.target.value)}
                          placeholder="LN001"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="loanAmount">Loan Amount *</Label>
                        <Input
                          id="loanAmount"
                          type="number"
                          value={formData.loanAmount || ''}
                          onChange={(e) => handleInputChange('loanAmount', parseFloat(e.target.value) || 0)}
                          placeholder="100000"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name *</Label>
                        <Input
                          id="bankName"
                          value={formData.bankName}
                          onChange={(e) => handleInputChange('bankName', e.target.value)}
                          placeholder="State Bank of India"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="branchName">Branch Name</Label>
                        <Input
                          id="branchName"
                          value={formData.branchName}
                          onChange={(e) => handleInputChange('branchName', e.target.value)}
                          placeholder="Main Branch"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sanctionedDate">Sanctioned Date</Label>
                        <Input
                          id="sanctionedDate"
                          type="date"
                          value={formData.sanctionedDate}
                          onChange={(e) => handleInputChange('sanctionedDate', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Beneficiary Details */}
                    <div className="space-y-4">
                      <h4 className="text-base font-medium text-foreground">Beneficiary Information</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="beneficiaryName">Full Name *</Label>
                        <Input
                          id="beneficiaryName"
                          value={formData.beneficiaryName}
                          onChange={(e) => handleInputChange('beneficiaryName', e.target.value)}
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="beneficiaryPhone">Phone Number *</Label>
                        <Input
                          id="beneficiaryPhone"
                          value={formData.beneficiaryPhone}
                          onChange={(e) => handleInputChange('beneficiaryPhone', e.target.value)}
                          placeholder="9876543210"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="beneficiaryEmail">Email Address</Label>
                        <Input
                          id="beneficiaryEmail"
                          type="email"
                          value={formData.beneficiaryEmail}
                          onChange={(e) => handleInputChange('beneficiaryEmail', e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="disbursed">Disbursed</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose of Loan</Label>
                    <Textarea
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => handleInputChange('purpose', e.target.value)}
                      placeholder="Agriculture, Business, Education, etc."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading} className="btn-primary">
                      {isLoading ? 'Creating...' : 'Create Loan'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Bulk Upload Tab */}
              <TabsContent value="bulk" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Bulk CSV/Excel Upload</h3>
                  <p className="text-muted-foreground">
                    Upload multiple loan records using CSV or Excel files
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button onClick={downloadCSVTemplate} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Download the CSV template with sample data
                    </span>
                  </div>

                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h4 className="text-lg font-medium text-foreground mb-2">Upload CSV/Excel File</h4>
                    <p className="text-muted-foreground mb-4">
                      Drag and drop your file here, or click to browse
                    </p>
                    <Button variant="outline" disabled>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File (Coming Soon)
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* PDF Extract Tab */}
              <TabsContent value="pdf" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">PDF OCR Extraction</h3>
                  <p className="text-muted-foreground">
                    Upload sanctioned loan PDFs and automatically extract loan details using OCR
                  </p>
                </div>

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h4 className="text-lg font-medium text-foreground mb-2">Upload Loan PDF</h4>
                  <p className="text-muted-foreground mb-4">
                    System will automatically extract beneficiary details, loan amount, and terms
                  </p>
                  <Button variant="outline" disabled>
                    <FileText className="w-4 h-4 mr-2" />
                    Upload PDF (Coming Soon)
                  </Button>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h5 className="font-medium text-foreground mb-2">Supported Information</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Beneficiary name and contact details</li>
                    <li>• Loan number and amount</li>
                    <li>• Bank and branch information</li>
                    <li>• Sanctioned date and purpose</li>
                    <li>• Asset details and specifications</li>
                  </ul>
                </div>
              </TabsContent>

              {/* API Integration Tab */}
              <TabsContent value="api" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">API Integration</h3>
                  <p className="text-muted-foreground">
                    Connect with external systems to automatically sync loan data
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Core Banking System</CardTitle>
                      <CardDescription>
                        Direct integration with your bank's core system
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" disabled className="w-full">
                        Configure API (Coming Soon)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Government Portal</CardTitle>
                      <CardDescription>
                        Sync with government loan disbursement portals
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" disabled className="w-full">
                        Setup Integration (Coming Soon)
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h5 className="font-medium text-foreground mb-2">API Endpoints</h5>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="font-mono bg-background p-2 rounded">
                      POST /api/loans - Create new loan
                    </div>
                    <div className="font-mono bg-background p-2 rounded">
                      GET /api/loans - Fetch loan data
                    </div>
                    <div className="font-mono bg-background p-2 rounded">
                      PUT /api/loans/:id - Update loan status
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};