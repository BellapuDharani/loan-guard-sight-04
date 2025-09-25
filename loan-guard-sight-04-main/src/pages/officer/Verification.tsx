import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { FileText, CheckCircle, XCircle, Clock, Eye, Download } from "lucide-react";

const mockVerifications = [
  {
    id: "V001",
    loanId: "L001",
    borrower: "John Smith",
    documentType: "Income Proof",
    status: "pending",
    uploadedDate: "2024-01-15",
    verificationProgress: 60,
    riskScore: 75,
    documents: [
      { name: "pay_stub_jan_2024.pdf", status: "verified" },
      { name: "bank_statement_dec_2023.pdf", status: "pending" },
      { name: "tax_return_2023.pdf", status: "pending" }
    ]
  },
  {
    id: "V002",
    loanId: "L002",
    borrower: "Sarah Johnson",
    documentType: "Identity Verification",
    status: "verified",
    uploadedDate: "2024-01-10",
    verificationProgress: 100,
    riskScore: 25,
    documents: [
      { name: "drivers_license.pdf", status: "verified" },
      { name: "passport.pdf", status: "verified" }
    ]
  },
  {
    id: "V003",
    loanId: "L003",
    borrower: "Mike Wilson",
    documentType: "Business Registration",
    status: "failed",
    uploadedDate: "2024-01-08",
    verificationProgress: 30,
    riskScore: 90,
    documents: [
      { name: "business_license.pdf", status: "failed" },
      { name: "tax_id_certificate.pdf", status: "pending" }
    ]
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    case "failed":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    case "pending":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getRiskBadge = (score: number) => {
  if (score <= 30) return <Badge variant="default" className="bg-green-100 text-green-800">Low Risk</Badge>;
  if (score <= 70) return <Badge variant="secondary">Medium Risk</Badge>;
  return <Badge variant="destructive">High Risk</Badge>;
};

export const Verification = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Document Verification</h1>
            <p className="text-muted-foreground">Review and verify borrower documents</p>
          </div>
        </div>

        {/* Verification Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Documents awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Successfully processed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Verification</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Risk Score</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">63</div>
              <p className="text-xs text-muted-foreground">Medium risk portfolio</p>
            </CardContent>
          </Card>
        </div>

        {/* Verification Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockVerifications.map((verification) => (
                <div key={verification.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{verification.borrower}</h3>
                      <p className="text-sm text-muted-foreground">
                        Loan ID: {verification.loanId} • {verification.documentType}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(verification.status)}
                      {getRiskBadge(verification.riskScore)}
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Verification Progress</span>
                        <span className="text-sm text-muted-foreground">{verification.verificationProgress}%</span>
                      </div>
                      <Progress value={verification.verificationProgress} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Risk Score</span>
                        <span className="text-sm text-muted-foreground">{verification.riskScore}/100</span>
                      </div>
                      <Progress 
                        value={verification.riskScore} 
                        className="h-2" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <h4 className="text-sm font-medium">Documents:</h4>
                    {verification.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{doc.name}</span>
                          {getStatusBadge(doc.status)}
                        </div>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {verification.status === 'pending' && (
                      <>
                        <Button variant="default" size="sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm">
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      View Full Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};