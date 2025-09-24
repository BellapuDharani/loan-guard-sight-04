interface LoanDocument {
  loanNumber: string;
  loanAmount: number;
  sanctionedItems?: {
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

interface UploadedBill {
  fileName: string;
  extractedData?: {
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
    }[];
    totalBillAmount: number;
    vendorName?: string;
    billDate?: string;
  };
}

interface PriceComparisonResult {
  match: 'exact' | 'partial' | 'mismatch' | 'insufficient_data';
  confidence: number;
  discrepancies: {
    type: 'price' | 'quantity' | 'item_missing' | 'total_mismatch';
    description: string;
    expectedValue: any;
    actualValue: any;
  }[];
  riskScore: number; // 0-100, higher means more risky
  recommendations: string[];
}

export class AIPriceComparisonService {
  static compareDocuments(loanDoc: LoanDocument, uploadedBill: UploadedBill): PriceComparisonResult {
    const discrepancies: any[] = [];
    let confidence = 0;
    let riskScore = 0;

    // Check if we have enough data
    if (!loanDoc.sanctionedItems || !uploadedBill.extractedData) {
      return {
        match: 'insufficient_data',
        confidence: 0,
        discrepancies: [{
          type: 'item_missing',
          description: 'Insufficient data for comparison - missing sanctioned items or bill data',
          expectedValue: 'Complete loan document with itemized breakdown',
          actualValue: 'Incomplete data'
        }],
        riskScore: 50,
        recommendations: ['Upload complete loan sanction document', 'Ensure bill has clear item-wise breakdown']
      };
    }

    const sanctionedItems = loanDoc.sanctionedItems;
    const billItems = uploadedBill.extractedData.items;

    // Compare total amounts first
    const sanctionedTotal = sanctionedItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const billTotal = uploadedBill.extractedData.totalBillAmount;

    if (Math.abs(sanctionedTotal - billTotal) > sanctionedTotal * 0.05) { // 5% tolerance
      discrepancies.push({
        type: 'total_mismatch',
        description: `Total amount mismatch exceeds 5% tolerance`,
        expectedValue: sanctionedTotal,
        actualValue: billTotal
      });
      riskScore += 30;
    }

    // Item-wise comparison
    let matchedItems = 0;
    
    for (const sanctionedItem of sanctionedItems) {
      const matchingBillItem = billItems.find(billItem => 
        this.isItemMatch(sanctionedItem.itemName, billItem.description)
      );

      if (!matchingBillItem) {
        discrepancies.push({
          type: 'item_missing',
          description: `Sanctioned item not found in bill: ${sanctionedItem.itemName}`,
          expectedValue: sanctionedItem,
          actualValue: null
        });
        riskScore += 20;
        continue;
      }

      matchedItems++;

      // Compare quantities
      if (Math.abs(sanctionedItem.quantity - matchingBillItem.quantity) > 0) {
        discrepancies.push({
          type: 'quantity',
          description: `Quantity mismatch for ${sanctionedItem.itemName}`,
          expectedValue: sanctionedItem.quantity,
          actualValue: matchingBillItem.quantity
        });
        riskScore += 15;
      }

      // Compare unit prices (10% tolerance for market fluctuations)
      const priceDifference = Math.abs(sanctionedItem.unitPrice - matchingBillItem.unitPrice);
      const tolerance = sanctionedItem.unitPrice * 0.10;
      
      if (priceDifference > tolerance) {
        discrepancies.push({
          type: 'price',
          description: `Unit price variance exceeds 10% for ${sanctionedItem.itemName}`,
          expectedValue: sanctionedItem.unitPrice,
          actualValue: matchingBillItem.unitPrice
        });
        riskScore += 25;
      }
    }

    // Calculate confidence based on matched items and discrepancies
    const matchPercentage = (matchedItems / sanctionedItems.length) * 100;
    confidence = Math.max(0, matchPercentage - (discrepancies.length * 10));

    // Determine match type
    let match: PriceComparisonResult['match'];
    if (discrepancies.length === 0) {
      match = 'exact';
    } else if (riskScore < 30 && matchedItems >= sanctionedItems.length * 0.8) {
      match = 'partial';
    } else {
      match = 'mismatch';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(discrepancies, riskScore);

    return {
      match,
      confidence: Math.round(confidence),
      discrepancies,
      riskScore: Math.min(100, riskScore),
      recommendations
    };
  }

  private static isItemMatch(sanctionedItem: string, billDescription: string): boolean {
    // Simple text matching - in production, use more sophisticated NLP
    const sanctionedWords = sanctionedItem.toLowerCase().split(' ');
    const billWords = billDescription.toLowerCase().split(' ');
    
    // Check if at least 60% of key words match
    const keyWords = sanctionedWords.filter(word => word.length > 3);
    const matches = keyWords.filter(word => 
      billWords.some(billWord => billWord.includes(word) || word.includes(billWord))
    );
    
    return matches.length >= Math.ceil(keyWords.length * 0.6);
  }

  private static generateRecommendations(discrepancies: any[], riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskScore > 70) {
      recommendations.push('High risk - Recommend field verification');
      recommendations.push('Cross-check vendor authenticity');
    } else if (riskScore > 40) {
      recommendations.push('Medium risk - Request additional documentation');
    } else if (riskScore > 20) {
      recommendations.push('Low risk - Minor discrepancies acceptable');
    }

    if (discrepancies.some(d => d.type === 'price')) {
      recommendations.push('Verify current market prices for flagged items');
    }

    if (discrepancies.some(d => d.type === 'quantity')) {
      recommendations.push('Confirm quantity requirements with beneficiary');
    }

    if (discrepancies.some(d => d.type === 'item_missing')) {
      recommendations.push('Request bills for all sanctioned items');
    }

    return recommendations;
  }

  static getRiskCategory(riskScore: number): 'green' | 'amber' | 'red' {
    if (riskScore <= 25) return 'green';
    if (riskScore <= 60) return 'amber';
    return 'red';
  }

  static shouldAutoApprove(result: PriceComparisonResult): boolean {
    return result.match === 'exact' && result.riskScore <= 25 && result.confidence >= 80;
  }
}