import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, AlertCircle, Eye, FileText } from 'lucide-react';
import { AIPriceComparisonService } from '@/services/aiPriceComparison';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PriceComparisonWidgetProps {
  userId: string;
  loanId: string;
  userFiles: any[];
}

export const PriceComparisonWidget: React.FC<PriceComparisonWidgetProps> = ({
  userId,
  loanId,
  userFiles
}) => {
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedResult, setSelectedResult] = useState<any>(null);

  useEffect(() => {
    performPriceComparison();
  }, [userId, loanId, userFiles]);

  const performPriceComparison = () => {
    // Get loan document data (this would come from your loan storage)
    const loanData = JSON.parse(localStorage.getItem('loanData') || '[]');
    const userProfile = JSON.parse(localStorage.getItem('userProfiles') || '[]')
      .find((p: any) => p.id === userId);
    
    const loanDocument = loanData.find((loan: any) => 
      loan.loanNumber === userProfile?.loanId || loan.beneficiaryId === userId
    );

    if (!loanDocument || !userFiles.length) {
      setComparisonResults([]);
      return;
    }

    const results = userFiles
      .filter(file => file.type === 'application/pdf' || file.name.toLowerCase().includes('bill'))
      .map(file => {
        // Mock extracted bill data - in production, this would come from OCR
        const mockBillData = {
          fileName: file.name,
          extractedData: {
            items: [
              {
                description: 'Tractor Engine Parts',
                quantity: 1,
                unitPrice: loanDocument.loanAmount * 0.8, // Mock: 80% of loan amount
                totalAmount: loanDocument.loanAmount * 0.8
              }
            ],
            totalBillAmount: loanDocument.loanAmount * 0.8,
            vendorName: 'ABC Machinery Pvt Ltd',
            billDate: new Date().toISOString()
          }
        };

        // Mock loan document with itemized breakdown
        const mockLoanDoc = {
          loanNumber: loanDocument.loanNumber,
          loanAmount: loanDocument.loanAmount,
          sanctionedItems: [
            {
              itemName: 'Agricultural Tractor',
              quantity: 1,
              unitPrice: loanDocument.loanAmount,
              totalPrice: loanDocument.loanAmount
            }
          ]
        };

        const comparison = AIPriceComparisonService.compareDocuments(mockLoanDoc, mockBillData);
        
        return {
          fileId: file.id,
          fileName: file.name,
          uploadedAt: file.uploadedAt,
          ...comparison
        };
      });

    setComparisonResults(results);
  };

  const getRiskBadge = (riskScore: number) => {
    const category = AIPriceComparisonService.getRiskCategory(riskScore);
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      amber: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200'
    };
    const icons = {
      green: CheckCircle,
      amber: AlertCircle,
      red: AlertTriangle
    };
    const Icon = icons[category];

    return (
      <Badge variant="outline" className={colors[category]}>
        <Icon className="w-3 h-3 mr-1" />
        {category.toUpperCase()} ({riskScore})
      </Badge>
    );
  };

  if (!comparisonResults.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Price Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No bills uploaded yet for comparison
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Price Comparison Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comparisonResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{result.fileName}</span>
                {getRiskBadge(result.riskScore)}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Match: {result.match.toUpperCase()}</span>
                <span>Confidence: {result.confidence}%</span>
                <span>Issues: {result.discrepancies.length}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {AIPriceComparisonService.shouldAutoApprove(result) && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Auto-approved
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedResult(result);
                    setShowDetails(true);
                  }}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Details
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Price Comparison Details</DialogTitle>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>File:</strong> {selectedResult.fileName}
                </div>
                <div>
                  <strong>Risk Score:</strong> {selectedResult.riskScore}/100
                </div>
                <div>
                  <strong>Match Type:</strong> {selectedResult.match}
                </div>
                <div>
                  <strong>Confidence:</strong> {selectedResult.confidence}%
                </div>
              </div>

              {selectedResult.discrepancies.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Discrepancies Found:</h4>
                  <div className="space-y-2">
                    {selectedResult.discrepancies.map((disc: any, idx: number) => (
                      <div key={idx} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                        <div className="font-medium text-red-800">{disc.type.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-red-700">{disc.description}</div>
                        {disc.expectedValue && disc.actualValue && (
                          <div className="text-xs text-red-600 mt-1">
                            Expected: {JSON.stringify(disc.expectedValue)} | 
                            Actual: {JSON.stringify(disc.actualValue)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-2">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {selectedResult.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground">{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};