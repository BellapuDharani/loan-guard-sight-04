import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Search, Eye, CheckCircle, XCircle, Clock } from "lucide-react";

const mockLoans = [
  {
    id: "L001",
    borrower: "John Smith",
    amount: "$50,000",
    type: "Personal Loan",
    status: "pending",
    submittedDate: "2024-01-15",
    verificationStatus: "documents_pending"
  },
  {
    id: "L002",
    borrower: "Sarah Johnson",
    amount: "$125,000",
    type: "Home Loan",
    status: "approved",
    submittedDate: "2024-01-10",
    verificationStatus: "verified"
  },
  {
    id: "L003",
    borrower: "Mike Wilson",
    amount: "$75,000",
    type: "Business Loan",
    status: "rejected",
    submittedDate: "2024-01-08",
    verificationStatus: "failed"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "approved":
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    case "pending":
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export const Loans = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Loan Management</h1>
            <p className="text-muted-foreground">Review and manage loan applications</p>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by borrower name or loan ID..."
                  className="pl-10"
                />
              </div>
              <Button variant="outline">Filter</Button>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Loan Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Borrower</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.id}</TableCell>
                    <TableCell>{loan.borrower}</TableCell>
                    <TableCell>{loan.amount}</TableCell>
                    <TableCell>{loan.type}</TableCell>
                    <TableCell>{getStatusBadge(loan.status)}</TableCell>
                    <TableCell>{loan.submittedDate}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};