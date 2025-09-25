import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, AlertCircle, Eye, FileText, Loader2 } from 'lucide-react';
import { AIPriceComparisonService } from '@/services/aiPriceComparison';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Tesseract from 'tesseract.js';

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
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  useEffect(() => {
    if (userFiles.length > 0) {
      performOCRAnalysis();
    } else {
      setExtractedData(null);
      setComparisonResults([]);
    }
  }, [userId, loanId, userFiles]);

  const performOCRAnalysis = async () => {
    const imageFiles = userFiles.filter(file => 
      file.type?.startsWith('image/') || 
      file.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)
    );

    if (imageFiles.length === 0) {
      setExtractedData(null);
      return;
    }

    setOcrLoading(true);
    try {
      // Use the first image file for OCR
      const file = imageFiles[0];
      
      // Create a file object for Tesseract
      const fileBlob = file.file || file; // Handle different file object structures
      
      const { data: { text } } = await Tesseract.recognize(fileBlob, 'eng', {
        logger: m => console.log(m) // Optional: log OCR progress
      });

      // Extract invoice data using regex patterns
      const extracted: Record<string, string> = {};
      
      // Extract Invoice Number
      const invoiceNo = text.match(/(?:Invoice|Bill|Receipt)\s*(?:No|#|Number)[:\s]*([A-Za-z0-9\-\/]+)/i);
      if (invoiceNo) extracted["Invoice No"] = invoiceNo[1].trim();

      // Extract Date
      const datePattern = text.match(/(?:Date|Dated)[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i);
      if (datePattern) extracted["Date"] = datePattern[1].trim();

      // Extract Total Amount
      const totalPattern = text.match(/(?:Total|Amount|Grand Total)[:\s]*(?:Rs\.?|₹|\$)?\s*([0-9,]+\.?[0-9]*)/i);
      if (totalPattern) extracted["Total"] = totalPattern[1].replace(/,/g, '');

      // Extract Vendor/Supplier
      const vendorPattern = text.match(/(?:Vendor|Supplier|From|Company)[:\s]*([A-Za-z\s]+?)(?:\n|Date|Address)/i);
      if (vendorPattern) extracted["Vendor"] = vendorPattern[1].trim();

      // Extract Items (simple extraction)
      const itemLines = text.split('\n').filter(line => 
        line.match(/[0-9]+\.?[0-9]*/) && line.length > 10
      ).slice(0, 3); // Take first 3 potential item lines

      // Calculate risk score based on extracted data completeness
      let riskScore = 0;
      if (!extracted["Invoice No"]) riskScore += 25;
      if (!extracted["Date"]) riskScore += 20;
      if (!extracted["Total"]) riskScore += 30;
      if (!extracted["Vendor"]) riskScore += 15;
      
      // Additional risk factors
      if (text.length < 100) riskScore += 20; // Very short text might indicate poor OCR
      if (!text.match(/[0-9]/)) riskScore += 40; // No numbers at all is suspicious

      const riskCategory = riskScore <= 25 ? "GREEN" : riskScore <= 60 ? "AMBER" : "RED";

      setExtractedData({
        ...extracted,
        ocrText: text,
        riskScore: Math.min(100, riskScore),
        riskCategory,
        items: itemLines,
        fileName: file.name
      });

    } catch (error) {
      console.error('OCR Error:', error);
      setExtractedData({
        error: "Failed to extract data from image",
        riskScore: 100,
        riskCategory: "RED"
      });
    } finally {
      setOcrLoading(false);
    }
  };

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

  // Show OCR loading state
  if (ocrLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Price Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Extracting data from uploaded bill...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show extracted data if available
  if (extractedData && !extractedData.error) {
    const borderColor = extractedData.riskCategory === "GREEN" ? "border-l-green-500" : 
                       extractedData.riskCategory === "AMBER" ? "border-l-yellow-500" : "border-l-red-500";

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Price Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Checklist Section */}
          <div>
            <h4 className="font-semibold mb-3">Checklist:</h4>
            <ul className="space-y-1 text-sm">
              {extractedData["Date"] && <li>• <strong>Date:</strong> {extractedData["Date"]}</li>}
              {extractedData["Total"] && <li>• <strong>Total:</strong> ₹{extractedData["Total"]}</li>}
              {extractedData["Vendor"] && <li>• <strong>Vendor:</strong> {extractedData["Vendor"]}</li>}
              {extractedData["Invoice No"] && <li>• <strong>Invoice No:</strong> {extractedData["Invoice No"]}</li>}
            </ul>
          </div>

          {/* Extracted Invoice Data Section */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-3">Extracted Invoice Data</h4>
            <p className="text-sm text-muted-foreground mb-4">OCR results mapped into structured fields</p>
            
            <div className="space-y-3">
              {Object.entries(extractedData).map(([key, value]) => {
                if (key === 'ocrText' || key === 'riskScore' || key === 'riskCategory' || key === 'items' || key === 'fileName') return null;
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm font-medium">{key}</span>
                    <span className="text-sm">{String(value)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Assessment Section */}
          <div className={`border-l-4 ${borderColor} pl-4`}>
            <h4 className="font-semibold mb-2">Risk Assessment</h4>
            <p className="text-sm text-muted-foreground mb-3">Based on OCR invoice analysis</p>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Score:</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold">{extractedData.riskScore} / 100</span>
                <Badge className={
                  extractedData.riskCategory === "GREEN" ? "bg-green-100 text-green-800 border-green-200" :
                  extractedData.riskCategory === "AMBER" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                  "bg-red-100 text-red-800 border-red-200"
                }>
                  {extractedData.riskCategory}
                </Badge>
              </div>
            </div>
          </div>

          {/* Show extracted items if any */}
          {extractedData.items && extractedData.items.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Detected Items:</h4>
              <ul className="text-sm space-y-1">
                {extractedData.items.map((item: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">• {item.trim()}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show error state if OCR failed
  if (extractedData?.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            AI Price Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{extractedData.error}</p>
            <Badge className="bg-red-100 text-red-800 border-red-200 mt-2">
              HIGH RISK
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

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