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
      // Get loan document for comparison
      const loanData = JSON.parse(localStorage.getItem('loanData') || '[]');
      const userProfile = JSON.parse(localStorage.getItem('userProfiles') || '[]')
        .find((p: any) => p.id === userId);
      
      const loanDocument = loanData.find((loan: any) => 
        loan.loanNumber === userProfile?.loanId || loan.beneficiaryId === userId
      );

      // Use the first image file for OCR
      const file = imageFiles[0];
      
      // Create proper image element for Tesseract
      let imageSource;
      if (file.file instanceof File) {
        imageSource = file.file;
      } else if (file instanceof File) {
        imageSource = file;
      } else {
        // If it's a URL or base64, use that directly
        imageSource = file.url || file;
      }
      
      const { data: { text } } = await Tesseract.recognize(imageSource, 'eng', {
        logger: m => console.log(m)
      });

      console.log('OCR Text:', text); // Debug log

      // Extract invoice data using improved regex patterns
      const extracted: Record<string, string> = {};
      
      // Extract Invoice Number - more flexible patterns
      const invoicePatterns = [
        /(?:Invoice|Bill|Receipt)\s*(?:No|#|Number)[:\s]*([A-Za-z0-9\-\/]+)/i,
        /INV[\-\s]*([A-Za-z0-9\-\/]+)/i,
        /Invoice[:\s]+([A-Za-z0-9\-\/]+)/i
      ];
      
      for (const pattern of invoicePatterns) {
        const match = text.match(pattern);
        if (match) {
          extracted["Invoice No"] = match[1].trim();
          break;
        }
      }

      // Extract Date - multiple formats
      const datePatterns = [
        /(?:Date|Dated)[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
        /([0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i,
        /([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{4})/i
      ];
      
      for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
          extracted["Date"] = match[1].trim();
          break;
        }
      }

      // Extract Total Amount - improved patterns
      const totalPatterns = [
        /(?:Total|Amount|Grand Total)[:\s]*(?:Rs\.?|₹|\$)?\s*([0-9,]+\.?[0-9]*)/i,
        /Total[:\s]+([0-9,]+\.?[0-9]*)/i,
        /([0-9,]+\.[0-9]{2})(?:\s*$)/i // Look for currency format at end of line
      ];
      
      for (const pattern of totalPatterns) {
        const match = text.match(pattern);
        if (match) {
          extracted["Total"] = match[1].replace(/,/g, '');
          break;
        }
      }

      // Extract Vendor/Supplier
      const vendorPatterns = [
        /(?:Vendor|Supplier|From|Company)[:\s]*([A-Za-z\s&\.Ltd]+?)(?:\n|Date|Address|Phone)/i,
        /([A-Z][A-Za-z\s&\.]+(?:Ltd|Inc|Corp)\.?)(?:\n)/i
      ];
      
      for (const pattern of vendorPatterns) {
        const match = text.match(pattern);
        if (match) {
          extracted["Vendor"] = match[1].trim();
          break;
        }
      }

      // Extract Asset Value if present
      const assetPattern = text.match(/(?:Asset\s*Value|Value)[:\s]*(?:Rs\.?|₹|\$)?\s*([0-9,]+\.?[0-9]*)/i);
      if (assetPattern) {
        extracted["Asset Value"] = assetPattern[1].replace(/,/g, '');
      }

      console.log('Extracted Data:', extracted); // Debug log

      // RISK ASSESSMENT LOGIC
      let riskScore = 0;
      let riskFactors: string[] = [];

      // 1. Data Completeness Check (30 points max)
      if (!extracted["Invoice No"]) {
        riskScore += 15;
        riskFactors.push("Missing invoice number");
      }
      if (!extracted["Date"]) {
        riskScore += 10;
        riskFactors.push("Missing date");
      }
      if (!extracted["Total"]) {
        riskScore += 15;
        riskFactors.push("Missing total amount");
      }
      if (!extracted["Vendor"]) {
        riskScore += 10;
        riskFactors.push("Missing vendor information");
      }

      // 2. Loan Document Comparison (40 points max)
      if (loanDocument) {
        const invoiceTotal = parseFloat(extracted["Total"] || "0");
        const loanAmount = parseFloat(loanDocument.loanAmount || "0");
        
        if (invoiceTotal > 0 && loanAmount > 0) {
          const difference = Math.abs(invoiceTotal - loanAmount) / loanAmount;
          
          if (difference > 0.5) { // More than 50% difference
            riskScore += 40;
            riskFactors.push(`Invoice amount (₹${invoiceTotal}) significantly differs from loan amount (₹${loanAmount})`);
          } else if (difference > 0.2) { // 20-50% difference
            riskScore += 25;
            riskFactors.push(`Invoice amount (₹${invoiceTotal}) moderately differs from loan amount (₹${loanAmount})`);
          } else if (difference > 0.1) { // 10-20% difference
            riskScore += 15;
            riskFactors.push(`Minor difference between invoice and loan amounts`);
          }
        }

        // Check vendor against loan document
        if (extracted["Vendor"] && loanDocument.vendor) {
          const vendorMatch = extracted["Vendor"].toLowerCase().includes(loanDocument.vendor.toLowerCase()) ||
                             loanDocument.vendor.toLowerCase().includes(extracted["Vendor"].toLowerCase());
          if (!vendorMatch) {
            riskScore += 20;
            riskFactors.push(`Vendor mismatch: Invoice shows "${extracted["Vendor"]}" but loan document shows "${loanDocument.vendor}"`);
          }
        }
      }

      // 3. OCR Quality Assessment (20 points max)
      if (text.length < 50) {
        riskScore += 20;
        riskFactors.push("Very poor OCR quality - insufficient text extracted");
      } else if (text.length < 100) {
        riskScore += 10;
        riskFactors.push("Poor OCR quality");
      }

      // 4. Suspicious Pattern Detection (10 points max)
      if (!text.match(/[0-9]/)) {
        riskScore += 10;
        riskFactors.push("No numbers detected - suspicious invoice");
      }

      // Determine risk category
      let riskCategory;
      if (riskScore <= 20) {
        riskCategory = "GREEN"; // All good, auto-approve
      } else if (riskScore <= 50) {
        riskCategory = "AMBER"; // Needs officer review
      } else {
        riskCategory = "RED"; // High risk, alert officer
      }

      setExtractedData({
        ...extracted,
        ocrText: text,
        riskScore: Math.min(100, riskScore),
        riskCategory,
        riskFactors,
        fileName: file.name,
        loanComparison: loanDocument ? {
          loanAmount: loanDocument.loanAmount,
          loanVendor: loanDocument.vendor
        } : null
      });

    } catch (error) {
      console.error('OCR Error:', error);
      setExtractedData({
        error: "Failed to extract data from image. Please ensure the image is clear and contains readable text.",
        riskScore: 100,
        riskCategory: "RED",
        riskFactors: ["OCR processing failed"],
        fileName: imageFiles[0]?.name || "Unknown"
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

          {/* Risk Assessment Section with detailed factors */}
          <div className={`border-l-4 ${borderColor} pl-4`}>
            <h4 className="font-semibold mb-2">Risk Assessment</h4>
            <p className="text-sm text-muted-foreground mb-3">Based on OCR invoice analysis and loan document comparison</p>
            
            <div className="flex items-center justify-between mb-3">
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

            {/* Show risk factors if any */}
            {extractedData.riskFactors && extractedData.riskFactors.length > 0 && (
              <div className="mt-3">
                <h5 className="text-sm font-medium mb-2">Risk Factors:</h5>
                <ul className="text-xs space-y-1">
                  {extractedData.riskFactors.map((factor: string, idx: number) => (
                    <li key={idx} className="text-muted-foreground flex items-start gap-1">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Show loan comparison if available */}
            {extractedData.loanComparison && (
              <div className="mt-3 p-2 bg-muted rounded text-xs">
                <strong>Loan Document Comparison:</strong>
                <div>Sanctioned Amount: ₹{extractedData.loanComparison.loanAmount}</div>
                {extractedData.loanComparison.loanVendor && (
                  <div>Approved Vendor: {extractedData.loanComparison.loanVendor}</div>
                )}
              </div>
            )}
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
            <p className="text-red-600 mb-2">{extractedData.error}</p>
            <Badge className="bg-red-100 text-red-800 border-red-200 mb-3">
              HIGH RISK - OFFICER ALERT
            </Badge>
            
            {extractedData.riskFactors && (
              <div className="text-left mt-4">
                <h5 className="font-medium mb-2">Issues Detected:</h5>
                <ul className="text-sm space-y-1">
                  {extractedData.riskFactors.map((factor: string, idx: number) => (
                    <li key={idx} className="text-red-600 flex items-start gap-1">
                      <span>•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-4 p-3 bg-red-50 rounded text-sm text-left">
              <strong>Officer Action Required:</strong>
              <p className="mt-1">This invoice requires immediate manual verification due to processing errors.</p>
            </div>
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