import React, { useState, useRef, useEffect } from 'react';
import { useExpenses } from '../../context/ExpenseContext';
import { ClaimCategory, EmployeeGrade, ExpenseClaim } from '../../types';
import { jsPDF } from 'jspdf';
import { 
  X, 
  UploadCloud, 
  Camera,
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  FileText, 
  Sparkles,
  ShieldCheck,
  Building,
  Calendar,
  DollarSign,
  AlertCircle,
  Eye,
  Info,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  Plus,
  Copy,
  ExternalLink,
  Globe,
  ArrowRightLeft,
  RefreshCw,
  History,
  Download,
  Clock,
  FileCheck,
  MessageSquare,
  Edit3,
  Layers,
  Shield
} from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SupportedCurrency {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar (SGD)' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (CAD)' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (AUD)' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)' },
];

export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.085,    // 1 EUR = 1.085 USD
  GBP: 1.305,    // 1 GBP = 1.305 USD
  JPY: 0.0067,   // 1 JPY = 0.0067 USD (1 USD = 149.25 JPY)
  SGD: 0.765,    // 1 SGD = 0.765 USD
  CAD: 0.735,    // 1 CAD = 0.735 USD
  AUD: 0.665,    // 1 AUD = 0.665 USD
  CHF: 1.155,    // 1 CHF = 1.155 USD
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  SGD: 'S$',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF ',
};

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): { convertedAmount: number; rate: number } {
  const fromRate = EXCHANGE_RATES_TO_USD[fromCurrency] || 1.0;
  const toRate = EXCHANGE_RATES_TO_USD[toCurrency] || 1.0;

  const inUSD = amount * fromRate;
  const result = inUSD / toRate;
  const directRate = fromRate / toRate;

  return {
    convertedAmount: Number(result.toFixed(2)),
    rate: Number(directRate.toFixed(4)),
  };
}

interface SampleReceipt {
  label: string;
  category: ClaimCategory;
  merchant: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  fileUrl: string;
  tax: number;
  lineItems: { description: string; amount: number }[];
  tags: string[];
  isOverLimitDemo?: boolean;
}

export interface DuplicateMatchResult {
  claim: ExpenseClaim;
  matchType: 'exact' | 'high_similarity';
  score: number;
  reasons: string[];
}

export interface ExpenseAuditHistoryEvent {
  id: string;
  timestamp: string;
  actor: string;
  eventType: 'OCR_SCAN' | 'MANUAL_EDIT' | 'POLICY_FLAG' | 'FX_CONVERSION' | 'DUPLICATE_CHECK' | 'TAG_EVENT' | 'USER_ANNOTATION';
  summary: string;
  details: string;
  fieldChanged?: string;
  previousValue?: string;
  newValue?: string;
}

/**
 * Scan existing expense claims to identify potential duplicate submissions
 * based on transaction date, merchant name, and monetary amount.
 */
export function scanForPotentialDuplicates(
  merchant: string,
  date: string,
  amount: number,
  existingClaims: ExpenseClaim[],
  currentClaimId?: string
): DuplicateMatchResult[] {
  if (!merchant || !date || amount <= 0) return [];

  const normalizedMerchant = merchant.trim().toLowerCase();
  const targetDate = new Date(date).getTime();
  const results: DuplicateMatchResult[] = [];

  for (const c of existingClaims) {
    if (currentClaimId && c.id === currentClaimId) continue;

    const existingMerchant = (c.merchantName || '').trim().toLowerCase();
    const existingDate = new Date(c.date).getTime();
    const existingAmount = c.amount;

    let score = 0;
    const reasons: string[] = [];

    // 1. Amount matching
    const amountDiff = Math.abs(existingAmount - amount);
    if (amountDiff <= 0.02) {
      score += 45;
      reasons.push(`Exact amount match: $${amount.toFixed(2)}`);
    } else if (amountDiff / amount < 0.05) {
      score += 25;
      reasons.push(`Close amount: $${amount.toFixed(2)} vs existing $${existingAmount.toFixed(2)} (within 5%)`);
    }

    // 2. Merchant name matching
    if (existingMerchant && normalizedMerchant) {
      if (existingMerchant === normalizedMerchant) {
        score += 35;
        reasons.push(`Identical merchant name: "${c.merchantName}"`);
      } else if (existingMerchant.includes(normalizedMerchant) || normalizedMerchant.includes(existingMerchant)) {
        score += 25;
        reasons.push(`Similar merchant name: "${c.merchantName}"`);
      }
    }

    // 3. Date matching
    if (!isNaN(targetDate) && !isNaN(existingDate)) {
      const dayDifference = Math.abs(targetDate - existingDate) / (1000 * 60 * 60 * 24);
      if (dayDifference === 0) {
        score += 20;
        reasons.push(`Identical transaction date: ${c.date}`);
      } else if (dayDifference <= 2) {
        score += 15;
        reasons.push(`Adjacent transaction date: ${c.date} (within ${Math.round(dayDifference)} day(s))`);
      }
    }

    if (score >= 60) {
      results.push({
        claim: c,
        matchType: score >= 90 ? 'exact' : 'high_similarity',
        score,
        reasons
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    label: 'Dinner in SF ($54.20 USD) — Domestic In Policy',
    category: 'Meals & Entertainment',
    merchant: 'The Grove Yerba Buena',
    amount: 54.20,
    currency: 'USD',
    date: '2026-10-13',
    description: 'Working dinner during SF Summit discussing backend integration',
    fileUrl: 'https://images.unsplash.com/photo-1554415707-9e49fe74a661?w=400&auto=format&fit=crop&q=80',
    tax: 4.80,
    lineItems: [
      { description: 'Salmon Harvest Bowl', amount: 32.00 },
      { description: 'Sparkling Water', amount: 6.50 },
      { description: 'Berry Tart', amount: 10.90 }
    ],
    tags: ['Client Lunch', 'Project X']
  },
  {
    label: 'London Client Dinner (£58.00 GBP) — FX Conversion Demo',
    category: 'Meals & Entertainment',
    merchant: 'Dishoom Shoreditch London',
    amount: 58.00,
    currency: 'GBP',
    date: '2026-10-14',
    description: 'Partner dinner with UK team lead discussing multi-region rollout',
    fileUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80',
    tax: 9.60,
    lineItems: [
      { description: 'House Black Daal & Naan', amount: 24.00 },
      { description: 'Chicken Ruby Feast', amount: 26.00 },
      { description: 'Chai & Beverages', amount: 8.00 }
    ],
    tags: ['Client Lunch', 'UK Expansion']
  },
  {
    label: 'Paris Business Lunch (€72.00 EUR) — FX Conversion Demo',
    category: 'Meals & Entertainment',
    merchant: 'Le Bistrot du Marais Paris',
    amount: 72.00,
    currency: 'EUR',
    date: '2026-10-15',
    description: 'Working lunch in Paris with European regulatory advisor',
    fileUrl: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=400&auto=format&fit=crop&q=80',
    tax: 12.00,
    lineItems: [
      { description: 'Plat du Jour Poisson', amount: 38.00 },
      { description: 'Salade Chèvre Chaud', amount: 22.00 },
      { description: 'Café Gourmand', amount: 12.00 }
    ],
    tags: ['Client Lunch', 'EU Regulatory']
  },
  {
    label: 'Tokyo Transit & Taxi (¥8,500 JPY) — FX Conversion Demo',
    category: 'Ground Transport / Taxi',
    merchant: 'Nihon Kotsu Tokyo Taxi',
    amount: 8500,
    currency: 'JPY',
    date: '2026-10-16',
    description: 'Airport ride from Haneda to Roppongi tech center',
    fileUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&auto=format&fit=crop&q=80',
    tax: 770,
    lineItems: [
      { description: 'Highway Express Taxi Haneda to Roppongi', amount: 8500 }
    ],
    tags: ['Project X', 'Tokyo Summit']
  },
  {
    label: 'SF Client Dinner ($94.50 USD) — Over Mid-Level Cap ($65)',
    category: 'Meals & Entertainment',
    merchant: 'Mourad Restaurant SF',
    amount: 94.50,
    currency: 'USD',
    date: '2026-10-14',
    description: 'Hosted 2 Cloudflare technical architects to sign off on SDK specifications',
    fileUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
    tax: 8.50,
    lineItems: [
      { description: 'Tagine Feast Shared', amount: 72.00 },
      { description: 'Artisan Teas & Infusions', amount: 14.00 }
    ],
    tags: ['Client Lunch', 'Project X', 'Cloudflare SDK'],
    isOverLimitDemo: true
  }
];

// Reference limits for grade comparison
const GRADE_POLICY_MATRIX: Record<EmployeeGrade, { meals: number; lodging: number; flights: string }> = {
  'Executive': { meals: 150, lodging: 350, flights: 'Business Class Permitted' },
  'Senior (Band C)': { meals: 90, lodging: 275, flights: 'Economy Class Required' },
  'Mid-level (Band B)': { meals: 65, lodging: 225, flights: 'Economy Class Required' },
  'Associate (Band A)': { meals: 45, lodging: 180, flights: 'Economy Class Required' },
};

const SUGGESTED_QUICK_TAGS = ['Client Lunch', 'Project X', 'Q4 Summit', 'Sales Pitch', 'Executive Offsite', 'R&D Sprint', 'Billable'];

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({ isOpen, onClose }) => {
  const { currentEmployee, trips, claims, submitClaim, evaluateClaimPolicy } = useExpenses();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Modal active tab: 'capture' (intake form) or 'history' (audit trail & events)
  const [activeModalTab, setActiveModalTab] = useState<'capture' | 'history'>('capture');

  const [selectedSample, setSelectedSample] = useState<SampleReceipt | null>(SAMPLE_RECEIPTS[0]);
  const [merchantName, setMerchantName] = useState(SAMPLE_RECEIPTS[0].merchant);
  const [amount, setAmount] = useState<string>(SAMPLE_RECEIPTS[0].amount.toString());
  const [receiptCurrency, setReceiptCurrency] = useState<string>(SAMPLE_RECEIPTS[0].currency || 'USD');
  const [date, setDate] = useState(SAMPLE_RECEIPTS[0].date);
  const [category, setCategory] = useState<ClaimCategory>(SAMPLE_RECEIPTS[0].category);
  const [purpose, setPurpose] = useState(SAMPLE_RECEIPTS[0].description);
  const [selectedTripId, setSelectedTripId] = useState<string>('trip-081');
  const [isExtracting, setIsExtracting] = useState(false);
  const [exceptionReason, setExceptionReason] = useState('');
  const [confidence, setConfidence] = useState(0.98);

  // Custom tags state
  const [tags, setTags] = useState<string[]>(SAMPLE_RECEIPTS[0].tags || ['Client Lunch', 'Project X']);
  const [tagInput, setTagInput] = useState('');

  // Duplicate acknowledgment override state
  const [acknowledgedDuplicate, setAcknowledgedDuplicate] = useState(false);

  const [uploadedPreview, setUploadedPreview] = useState<string | null>(SAMPLE_RECEIPTS[0].fileUrl);
  const [extractedWithGemini, setExtractedWithGemini] = useState(false);
  const [detectedCurrencyBadge, setDetectedCurrencyBadge] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedLineItems, setExtractedLineItems] = useState<{ description: string; amount: number }[]>(SAMPLE_RECEIPTS[0].lineItems);
  const [showGradeMatrix, setShowGradeMatrix] = useState(false);
  const [simulatedGrade, setSimulatedGrade] = useState<EmployeeGrade>(currentEmployee.grade);

  // History Audit Trail State
  const [auditHistory, setAuditHistory] = useState<ExpenseAuditHistoryEvent[]>(() => [
    {
      id: `aud-init-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: 'Gemini Multimodal Vision Engine',
      eventType: 'OCR_SCAN',
      summary: 'Initial receipt scan and field parsing',
      details: `Parsed merchant "${SAMPLE_RECEIPTS[0].merchant}", total amount $${SAMPLE_RECEIPTS[0].amount.toFixed(2)} ${SAMPLE_RECEIPTS[0].currency}, line items, and confidence 98%.`
    },
    {
      id: `aud-policy-${Date.now() + 1}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: 'Patty Policy Rules Engine',
      eventType: 'POLICY_FLAG',
      summary: 'Automated policy limit verification',
      details: `Evaluated against ${currentEmployee.grade} policy limits for ${SAMPLE_RECEIPTS[0].category}. Auto-authorization conditions verified.`
    }
  ]);

  // History Tab Filter & New Note
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'MANUAL_EDIT' | 'POLICY_FLAG' | 'OCR_SCAN'>('ALL');
  const [newAnnotation, setNewAnnotation] = useState('');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Ref tracking previous values for edit logging
  const prevValuesRef = useRef({
    merchant: SAMPLE_RECEIPTS[0].merchant,
    amount: SAMPLE_RECEIPTS[0].amount.toString(),
    category: SAMPLE_RECEIPTS[0].category,
    currency: SAMPLE_RECEIPTS[0].currency,
    date: SAMPLE_RECEIPTS[0].date
  });

  if (!isOpen) return null;

  // Determine user's home currency based on their legal entity
  const homeCurrency = currentEmployee.legalEntity === 'Patty UK Ltd' 
    ? 'GBP' 
    : currentEmployee.legalEntity === 'Patty SG Pte' 
    ? 'SGD' 
    : 'USD';

  // Filter approved trips for this employee
  const employeeTrips = trips.filter(t => t.employeeId === currentEmployee.id && t.status === 'approved');
  const matchedTrip = trips.find(t => t.id === selectedTripId);

  // Real-time conversion calculation to user's home currency
  const numAmount = parseFloat(amount) || 0;
  const isForeignCurrency = receiptCurrency !== homeCurrency;
  const { convertedAmount, rate: conversionRate } = convertCurrency(numAmount, receiptCurrency, homeCurrency);

  // Policy evaluation uses the home currency equivalent amount for accurate grade limits testing
  const policyEvaluationAmount = isForeignCurrency ? convertedAmount : numAmount;

  const employeeForEvaluation = {
    ...currentEmployee,
    grade: simulatedGrade
  };
  const policyAssessment = evaluateClaimPolicy(
    employeeForEvaluation,
    'reimbursement',
    category,
    policyEvaluationAmount,
    matchedTrip
  );

  const isViolation = Boolean(policyAssessment.excessAmount && policyAssessment.excessAmount > 0);

  // Scan existing expense records for potential duplicates based on date, merchant, and amount
  const potentialDuplicates = scanForPotentialDuplicates(merchantName, date, policyEvaluationAmount, claims);

  // Helper to log audit events
  const logAuditEvent = (
    eventType: ExpenseAuditHistoryEvent['eventType'],
    summary: string,
    details: string,
    fieldChanged?: string,
    previousValue?: string,
    newValue?: string
  ) => {
    const newEntry: ExpenseAuditHistoryEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      actor: currentEmployee.name,
      eventType,
      summary,
      details,
      fieldChanged,
      previousValue,
      newValue
    };
    setAuditHistory(prev => [newEntry, ...prev]);
  };

  // Tag helper functions
  const handleAddTag = (tagToAdd?: string) => {
    const raw = tagToAdd !== undefined ? tagToAdd : tagInput;
    const cleanTag = raw.trim();
    if (!cleanTag) return;

    // Check if already in tags (case-insensitive)
    const exists = tags.some(t => t.toLowerCase() === cleanTag.toLowerCase());
    if (!exists) {
      setTags([...tags, cleanTag]);
      logAuditEvent('TAG_EVENT', `Tag added: #${cleanTag}`, `Attached custom categorization tag #${cleanTag} to this expense.`);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
    logAuditEvent('TAG_EVENT', `Tag removed: #${tagToRemove}`, `Removed categorization tag #${tagToRemove} from this expense.`);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Add User Custom Annotation to Audit History
  const handleAddUserAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnotation.trim()) return;
    logAuditEvent(
      'USER_ANNOTATION',
      'User verification note added',
      newAnnotation.trim()
    );
    setNewAnnotation('');
  };

  // Track Field Blurs for Manual Edit Audit Logging
  const handleMerchantBlur = () => {
    if (merchantName !== prevValuesRef.current.merchant) {
      logAuditEvent(
        'MANUAL_EDIT',
        `Merchant updated to "${merchantName}"`,
        `Changed vendor name from "${prevValuesRef.current.merchant}" to "${merchantName}".`,
        'merchant',
        prevValuesRef.current.merchant,
        merchantName
      );
      prevValuesRef.current.merchant = merchantName;
    }
  };

  const handleAmountBlur = () => {
    if (amount !== prevValuesRef.current.amount) {
      logAuditEvent(
        'MANUAL_EDIT',
        `Expense amount updated to ${receiptCurrency} ${amount}`,
        `Adjusted total claimed amount from ${receiptCurrency} ${prevValuesRef.current.amount} to ${receiptCurrency} ${amount}.`,
        'amount',
        prevValuesRef.current.amount,
        amount
      );
      prevValuesRef.current.amount = amount;
    }
  };

  const handleCategoryChange = (newCat: ClaimCategory) => {
    const oldCat = category;
    setCategory(newCat);
    logAuditEvent(
      'MANUAL_EDIT',
      `Category changed to "${newCat}"`,
      `Reclassified expense from "${oldCat}" to "${newCat}". Triggered policy re-evaluation.`,
      'category',
      oldCat,
      newCat
    );
  };

  const handleCurrencyChange = (newCurr: string) => {
    const oldCurr = receiptCurrency;
    setReceiptCurrency(newCurr);
    const { convertedAmount: newConverted, rate } = convertCurrency(numAmount, newCurr, homeCurrency);
    logAuditEvent(
      'FX_CONVERSION',
      `Receipt currency set to ${newCurr}`,
      `Selected ${newCurr}. Real-time conversion to ${homeCurrency}: ${CURRENCY_SYMBOLS[homeCurrency] || ''}${newConverted.toFixed(2)} @ FX rate ${rate}.`,
      'currency',
      oldCurr,
      newCurr
    );
  };

  // Gemini Multimodal Vision extraction function
  const scanImageWithGemini = async (options: { base64?: string; imageUrl?: string; mimeType?: string }) => {
    setIsExtracting(true);
    setExtractionError(null);
    setAcknowledgedDuplicate(false);

    try {
      const res = await fetch('/api/gemini/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: options.base64,
          imageUrl: options.imageUrl,
          mimeType: options.mimeType || 'image/jpeg'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const result = await res.json();
      if (result.success && result.data) {
        const d = result.data;
        if (d.merchantName) setMerchantName(d.merchantName);
        if (d.date) setDate(d.date);
        if (d.total !== undefined && !isNaN(d.total)) setAmount(d.total.toString());
        if (d.currency) {
          const upperCurr = d.currency.toUpperCase();
          const isSupported = SUPPORTED_CURRENCIES.some(c => c.code === upperCurr);
          if (isSupported) {
            setReceiptCurrency(upperCurr);
            setDetectedCurrencyBadge(upperCurr);
          }
        }
        if (d.lineItems && Array.isArray(d.lineItems)) setExtractedLineItems(d.lineItems);
        if (d.confidenceScore) setConfidence(d.confidenceScore);
        setExtractedWithGemini(true);

        logAuditEvent(
          'OCR_SCAN',
          `Gemini Vision extraction successful (${d.merchantName || 'Vendor'})`,
          `Extracted total: ${d.currency || 'USD'} ${d.total}, date: ${d.date}, merchant: ${d.merchantName}. Vision confidence score: ${(d.confidenceScore || 0.95) * 100}%.`
        );
      }
    } catch (err: any) {
      console.warn('Gemini vision extraction failed:', err);
      setExtractionError(err.message || 'Vision extraction encountered an error.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Sample receipt loader
  const handleSelectSample = (sample: SampleReceipt) => {
    setSelectedSample(sample);
    setMerchantName(sample.merchant);
    setAmount(sample.amount.toString());
    setReceiptCurrency(sample.currency || 'USD');
    setDate(sample.date);
    setCategory(sample.category);
    setPurpose(sample.description);
    setUploadedPreview(sample.fileUrl);
    setExtractedLineItems(sample.lineItems);
    setTags(sample.tags || []);
    setExtractedWithGemini(false);
    setDetectedCurrencyBadge(sample.currency !== 'USD' ? sample.currency : null);
    setAcknowledgedDuplicate(false);
    setExceptionReason('');

    prevValuesRef.current = {
      merchant: sample.merchant,
      amount: sample.amount.toString(),
      category: sample.category,
      currency: sample.currency,
      date: sample.date
    };

    logAuditEvent(
      'OCR_SCAN',
      `Loaded preset receipt: ${sample.merchant}`,
      `Amount: ${sample.currency} ${sample.amount.toFixed(2)}, Category: ${sample.category}, Date: ${sample.date}. Tags: ${sample.tags.join(', ')}.`
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        setUploadedPreview(base64Data);
        setSelectedSample(null);
        setAcknowledgedDuplicate(false);
        logAuditEvent(
          'MANUAL_EDIT',
          `Image uploaded: ${file.name}`,
          `File size: ${(file.size / 1024).toFixed(0)} KB, Type: ${file.type || 'image/jpeg'}. Triggering multimodal vision.`
        );
        await scanImageWithGemini({ base64: base64Data, mimeType: file.type || 'image/jpeg' });
      };
      reader.readAsDataURL(file);
    }
  };

  // -------------------------------------------------------------
  // PDF REPORT GENERATOR (Summarized PDF Receipt Report via jsPDF)
  // -------------------------------------------------------------
  const generateAndDownloadExpensePDF = () => {
    setIsPdfGenerating(true);
    setPdfSuccessMessage(null);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const voucherNum = `VOUCH-${Date.now().toString().slice(-6)}`;
      const generatedDate = new Date().toLocaleString();

      // Top Header Banner (Emerald Branding)
      doc.setFillColor(6, 78, 59); // emerald-900
      doc.rect(0, 0, pageWidth, 60, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('PATTY WORKFORCE EXPENSE MANAGEMENT', 40, 32);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(209, 250, 229); // emerald-100
      doc.text('SUMMARIZED EXPENSE RECEIPT REPORT & AUDIT RECORD', 40, 48);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Ref: ${voucherNum}`, pageWidth - 140, 32);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 140, 46);

      let yPos = 85;

      // Section 1: Employee & Corporate Hierarchy
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.roundedRect(40, yPos, pageWidth - 80, 55, 4, 4, 'FD');

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('EMPLOYEE & ORG HIERARCHY', 50, yPos + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Employee: ${currentEmployee.name} (${currentEmployee.email})`, 50, yPos + 32);
      doc.text(`User Grade: ${simulatedGrade}  |  Entity: ${currentEmployee.legalEntity}`, 50, yPos + 45);
      doc.text(`Department: ${currentEmployee.department}`, 330, yPos + 32);
      doc.text(`Direct Manager: ${currentEmployee.managerName}`, 330, yPos + 45);

      yPos += 70;

      // Section 2: Expense Item Details
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(40, yPos, pageWidth - 80, 75, 4, 4, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('EXPENSE TRANSACTION DETAILS', 50, yPos + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Merchant / Vendor: ${merchantName}`, 50, yPos + 32);
      doc.text(`Transaction Date: ${date}`, 50, yPos + 45);
      doc.text(`Expense Category: ${category}`, 50, yPos + 58);

      // Financial Amounts Box (Right side)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(6, 78, 59);
      const amountStr = `${CURRENCY_SYMBOLS[receiptCurrency] || ''}${numAmount.toFixed(2)} ${receiptCurrency}`;
      doc.text(amountStr, 330, yPos + 34);

      if (isForeignCurrency) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Home Currency Equivalent: ${CURRENCY_SYMBOLS[homeCurrency] || '$'}${convertedAmount.toFixed(2)} ${homeCurrency}`, 330, yPos + 48);
        doc.text(`FX Exchange Rate: 1 ${receiptCurrency} = ${conversionRate} ${homeCurrency}`, 330, yPos + 60);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Domestic Base Currency: ${homeCurrency}`, 330, yPos + 48);
      }

      yPos += 90;

      // Business Purpose & Tags
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Business Purpose:', 40, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const splitPurpose = doc.splitTextToSize(purpose, pageWidth - 160);
      doc.text(splitPurpose, 135, yPos);

      yPos += Math.max(20, splitPurpose.length * 12);

      if (tags.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text('Tags & Projects:', 40, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(6, 78, 59);
        doc.text(tags.map(t => `#${t}`).join('   '), 135, yPos);
        yPos += 18;
      }

      // Section 3: Itemized Line Items (if present)
      if (extractedLineItems && extractedLineItems.length > 0) {
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text('ITEMIZED LINE ITEMS BREAKDOWN', 40, yPos);
        yPos += 10;

        doc.setFillColor(241, 245, 249);
        doc.rect(40, yPos, pageWidth - 80, 16, 'F');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('Description', 50, yPos + 11);
        doc.text('Amount', pageWidth - 100, yPos + 11);
        yPos += 18;

        doc.setFont('helvetica', 'normal');
        extractedLineItems.forEach(item => {
          doc.text(item.description, 50, yPos);
          doc.text(`${CURRENCY_SYMBOLS[receiptCurrency] || ''}${item.amount.toFixed(2)}`, pageWidth - 100, yPos);
          yPos += 13;
        });

        doc.setDrawColor(226, 232, 240);
        doc.line(40, yPos, pageWidth - 40, yPos);
        yPos += 10;
      }

      // Section 4: Policy Engine Evaluation
      doc.setFillColor(isViolation ? 254 : 240, isViolation ? 242 : 253, isViolation ? 242 : 244);
      doc.setDrawColor(isViolation ? 252 : 187, isViolation ? 165 : 247, isViolation ? 165 : 208);
      doc.roundedRect(40, yPos, pageWidth - 80, 48, 4, 4, 'FD');

      doc.setTextColor(isViolation ? 153 : 6, isViolation ? 27 : 78, isViolation ? 27 : 59);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`POLICY EVALUATION: ${isViolation ? 'POLICY LIMIT EXCEEDED (EXCEPTION REQUIRED)' : 'IN POLICY (AUTO-AUTHORIZATION ELIGIBLE)'}`, 50, yPos + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Rule: ${policyAssessment.matchedRuleName}  |  Cap: $${(policyAssessment.maxAllowedAmount || 0).toFixed(2)} ${homeCurrency}`, 50, yPos + 26);
      doc.text(policyAssessment.explanation, 50, yPos + 38);

      yPos += 60;

      // Section 5: Audit Log & History Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('AUDIT LOG & TIMESTAMPS SUMMARY', 40, yPos);
      yPos += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);

      auditHistory.slice(0, 5).forEach(event => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(`[${event.timestamp}] ${event.eventType}: ${event.summary}`, 40, yPos);
        yPos += 11;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        const splitDetails = doc.splitTextToSize(`Actor: ${event.actor} — ${event.details}`, pageWidth - 100);
        doc.text(splitDetails, 50, yPos);
        yPos += splitDetails.length * 10 + 2;
      });

      // Bottom Certification Footer
      doc.setDrawColor(203, 213, 225);
      doc.line(40, 800, pageWidth - 40, 800);

      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('CONFIDENTIAL & COMPLIANT · PATTY WORKFORCE EXPENSE GOVERNANCE · RETAIN FOR AUDIT TRAILS', 40, 814);
      doc.text(`Generated at ${generatedDate}`, pageWidth - 180, 814);

      // Save and trigger file download
      const cleanFileName = `Expense_Receipt_${merchantName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}.pdf`;
      doc.save(cleanFileName);

      logAuditEvent(
        'USER_ANNOTATION',
        'PDF Receipt Report Generated',
        `Downloaded formal summarized PDF receipt report (${cleanFileName}) for record-keeping.`
      );

      setPdfSuccessMessage(`Downloaded PDF report: ${cleanFileName}`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert('Unable to generate PDF report: ' + (err.message || 'Unknown error'));
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    // Check duplicate guard
    if (potentialDuplicates.length > 0 && !acknowledgedDuplicate) {
      alert(`Notice: Potential duplicate detected against existing record ${potentialDuplicates[0].claim.claimNumber}. Please review the duplicate warning and check the confirmation box if this is a distinct expense.`);
      return;
    }

    // Format description with FX conversion note if foreign
    const finalBusinessPurpose = isForeignCurrency
      ? `${purpose} [Charged: ${CURRENCY_SYMBOLS[receiptCurrency] || ''}${numAmount.toFixed(2)} ${receiptCurrency} ≈ ${CURRENCY_SYMBOLS[homeCurrency] || '$'}${convertedAmount.toFixed(2)} ${homeCurrency} @ FX ${conversionRate}]`
      : potentialDuplicates.length > 0
      ? `${purpose} (Verified non-duplicate of ${potentialDuplicates.map(d => d.claim.claimNumber).join(', ')})`
      : purpose;

    submitClaim({
      type: 'reimbursement',
      employeeId: currentEmployee.id,
      amount: policyEvaluationAmount,
      currency: homeCurrency,
      category,
      merchantName,
      date,
      businessPurpose: finalBusinessPurpose,
      tripId: selectedTripId || undefined,
      submissionChannel: 'web_portal',
      isExceptionRequested: isViolation,
      exceptionReason: isViolation ? exceptionReason : undefined,
      tags: tags,
      receipt: {
        name: `${merchantName.toLowerCase().replace(/\s+/g, '_')}_receipt.jpg`,
        url: uploadedPreview || selectedSample?.fileUrl || 'https://images.unsplash.com/photo-1554415707-9e49fe74a661?w=400&auto=format&fit=crop&q=80',
        size: '320 KB',
        mimeType: 'image/jpeg',
        merchantName,
        date,
        total: numAmount,
        currency: receiptCurrency,
        confidenceScore: confidence,
        lineItems: extractedLineItems
      }
    });

    onClose();
  };

  const currentCurrencySymbol = CURRENCY_SYMBOLS[receiptCurrency] || '$';
  const homeCurrencySymbol = CURRENCY_SYMBOLS[homeCurrency] || '$';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transition-all my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Receipt Capture & Policy Intake</h2>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Gemini Multimodal Vision
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Extracts data, converts currencies, tests grade policy limits, and maintains timestamped audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Download PDF Receipt Report Button */}
            <button
              type="button"
              onClick={generateAndDownloadExpensePDF}
              disabled={isPdfGenerating}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors shadow-2xs"
              title="Download formatted PDF receipt report for this expense"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isPdfGenerating ? 'Generating...' : 'PDF Report'}</span>
            </button>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs: Intake & Capture VS History */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-100/70 border-b border-slate-200 shrink-0 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveModalTab('capture')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeModalTab === 'capture'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Intake & Capture</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeModalTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-blue-700" />
              <span>History & Audit Trail</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold bg-slate-200 text-slate-700">
                {auditHistory.length}
              </span>
            </button>
          </div>

          {pdfSuccessMessage && (
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{pdfSuccessMessage}</span>
            </span>
          )}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: INTAKE & CAPTURE FORM */}
        {/* ========================================================================= */}
        {activeModalTab === 'capture' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Quick presets */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Sample Receipts (Includes International FX & Domestic):
                </label>
                <button
                  type="button"
                  onClick={() => setShowGradeMatrix(!showGradeMatrix)}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{showGradeMatrix ? 'Hide' : 'View'} Grade Policy Caps</span>
                  {showGradeMatrix ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Collapsible Grade Policy Reference Matrix */}
              {showGradeMatrix && (
                <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                  <div className="font-semibold text-slate-800 flex items-center justify-between">
                    <span>Corporate Policy Allowances by Employee Grade:</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-slate-500">Test as:</span>
                      <select
                        value={simulatedGrade}
                        onChange={(e) => {
                          const newGrade = e.target.value as EmployeeGrade;
                          setSimulatedGrade(newGrade);
                          logAuditEvent(
                            'POLICY_FLAG',
                            `Testing grade changed to ${newGrade}`,
                            `Re-evaluated expense against ${newGrade} policy rules.`
                          );
                        }}
                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 font-semibold text-slate-800"
                      >
                        <option value="Executive">Executive</option>
                        <option value="Senior (Band C)">Senior (Band C)</option>
                        <option value="Mid-level (Band B)">Mid-level (Band B)</option>
                        <option value="Associate (Band A)">Associate (Band A)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    {(['Executive', 'Senior (Band C)', 'Mid-level (Band B)', 'Associate (Band A)'] as EmployeeGrade[]).map(g => (
                      <div 
                        key={g} 
                        className={`p-2 rounded border ${
                          simulatedGrade === g ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="font-bold text-slate-800 truncate">{g.split(' ')[0]}</div>
                        <div className="text-slate-600 mt-0.5">Meal: <strong className="text-emerald-700">${GRADE_POLICY_MATRIX[g].meals}</strong></div>
                        <div className="text-slate-600">Hotel: <strong className="text-slate-800">${GRADE_POLICY_MATRIX[g].lodging}</strong></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SAMPLE_RECEIPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className={`p-2.5 text-left border rounded-lg transition-all text-xs flex flex-col justify-between ${
                      selectedSample?.label === sample.label
                        ? 'border-emerald-700 bg-emerald-50/60 ring-1 ring-emerald-700/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-slate-900 truncate pr-2">{sample.merchant}</span>
                      <span className="font-mono font-bold text-emerald-800 shrink-0">
                        {CURRENCY_SYMBOLS[sample.currency] || '$'}{sample.amount.toFixed(2)} {sample.currency}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sample.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload or Camera Capture Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Receipt Evidence (Image / Document):</span>
                <span className="text-[11px] text-slate-400 font-normal">Supports JPG, PNG, WebP or Camera Snap</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors bg-slate-50/50"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-semibold">Upload Receipt File</span>
                </button>

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-lg text-slate-600 hover:text-emerald-700 transition-colors bg-slate-50/50"
                >
                  <Camera className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-semibold">Camera Snapshot</span>
                </button>
              </div>

              {/* Status / Preview */}
              {isExtracting && (
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Gemini Multimodal Vision scanning receipt and extracting transaction parameters...</span>
                </div>
              )}

              {uploadedPreview && !isExtracting && (
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <img src={uploadedPreview} alt="Receipt Preview" className="w-12 h-12 object-cover rounded border border-slate-300" />
                  <div className="text-xs text-slate-600 flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 truncate">Evidence Attached</div>
                    <div className="text-[11px] text-slate-500">
                      {extractedWithGemini ? 'Extracted by Gemini Multimodal Vision' : 'Sample preset attached'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (uploadedPreview) scanImageWithGemini({ imageUrl: uploadedPreview });
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded border border-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Re-Scan</span>
                  </button>
                </div>
              )}
            </div>

            {/* Extracted Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Merchant Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Merchant / Vendor Name</label>
                <input
                  type="text"
                  required
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  onBlur={handleMerchantBlur}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Amount & Currency */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Receipt Amount & Currency</label>
                  {detectedCurrencyBadge && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                      Detected: {detectedCurrencyBadge}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <select
                    value={receiptCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="text-xs border border-slate-200 rounded-md p-2 bg-slate-50 font-semibold text-slate-800 shrink-0"
                  >
                    {SUPPORTED_CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} ({curr.symbol})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-xs">{currentCurrencySymbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      onBlur={handleAmountBlur}
                      className={`w-full text-xs border rounded-md p-2 pl-7 font-mono font-bold focus:ring-1 focus:outline-hidden ${
                        isViolation ? 'border-red-400 text-red-900 bg-red-50/30 focus:ring-red-500' : 'border-slate-200 text-slate-900 focus:ring-emerald-600'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* REAL-TIME FX CONVERSION ESTIMATE BANNER (If Foreign Currency) */}
            {isForeignCurrency && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between text-blue-950 font-semibold">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-700" />
                    <span>Foreign Currency Detected: Real-Time Conversion Estimate</span>
                  </div>
                  <span className="font-mono text-[11px] text-blue-700">1 {receiptCurrency} = {conversionRate} {homeCurrency}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700 pt-0.5">
                  <span>Charged in {receiptCurrency}: <strong>{currentCurrencySymbol}{numAmount.toFixed(2)}</strong></span>
                  <span className="text-sm font-bold font-mono text-emerald-800">
                    ≈ {homeCurrencySymbol}{convertedAmount.toFixed(2)} {homeCurrency}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Expense will be recorded in your home payroll currency (<span className="font-semibold text-slate-700">{homeCurrency}</span>) for reimbursement. Policy allowances below are tested against this converted amount.
                </p>
              </div>
            )}

            {/* Category & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value as ClaimCategory)}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-hidden text-slate-800"
                >
                  <option value="Meals & Entertainment">Meals & Entertainment</option>
                  <option value="Hotel & Lodging">Hotel & Lodging</option>
                  <option value="Ground Transport / Taxi">Ground Transport / Taxi</option>
                  <option value="Flights">Flights</option>
                  <option value="Office & Equipment">Office & Equipment</option>
                  <option value="Software & Subscriptions">Software & Subscriptions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setDate(newDate);
                    logAuditEvent('MANUAL_EDIT', `Date updated to ${newDate}`, `Changed transaction date to ${newDate}.`, 'date', date, newDate);
                  }}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Custom Categorization Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Custom Categorization Tags</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Press Enter or click Add to attach</span>
              </label>

              {/* Tag Badges List */}
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-white text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-md text-xs font-semibold shadow-2xs group"
                    >
                      <span className="text-emerald-600 font-mono text-[10px]">#</span>
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-red-600 ml-0.5 p-0.5 rounded transition-colors"
                        title="Remove tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input for custom tag */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-xs">#</span>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="e.g. Client Lunch, Project X, Q4 Summit..."
                    className="w-full text-xs border border-slate-200 rounded-md p-2 pl-6 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden text-slate-800"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleAddTag()}
                  className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[11px] text-slate-400 mr-1">Suggestions:</span>
                {SUGGESTED_QUICK_TAGS.map(suggested => (
                  <button
                    key={suggested}
                    type="button"
                    onClick={() => handleAddTag(suggested)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-slate-600 border border-slate-200 rounded text-[11px] font-medium transition-colors"
                  >
                    + {suggested}
                  </button>
                ))}
              </div>
            </div>

            {/* Business Purpose & Trip Association */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Purpose</label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  onBlur={() => {
                    logAuditEvent('MANUAL_EDIT', 'Business purpose updated', `Purpose description edited to: "${purpose}".`);
                  }}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Approved Trip</label>
                <select
                  value={selectedTripId}
                  onChange={(e) => {
                    const newTrip = e.target.value;
                    setSelectedTripId(newTrip);
                    logAuditEvent('MANUAL_EDIT', `Trip linked: ${newTrip || 'None'}`, `Associated with travel itinerary ${newTrip}.`);
                  }}
                  className="w-full text-xs border border-slate-200 rounded-md p-2 bg-white focus:ring-1 focus:ring-emerald-600 focus:outline-hidden text-slate-800"
                >
                  <option value="">-- No Trip / Local Expense --</option>
                  {employeeTrips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.tripNumber}: {t.destinations[0]?.city} ({t.destinations[0]?.startDate})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DUPLICATE DETECTION WARNING BANNER (If Potential Duplicates Found) */}
            {potentialDuplicates.length > 0 && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-lg text-xs space-y-2">
                <div className="flex items-start gap-2">
                  <Copy className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <span>Potential Duplicate Expense Record Detected ({potentialDuplicates.length} match)</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase bg-amber-200 text-amber-900 border border-amber-300">
                        {potentialDuplicates[0].matchType === 'exact' ? '100% Exact Match' : `${potentialDuplicates[0].score}% Similarity`}
                      </span>
                    </div>

                    <div className="p-2 bg-white/80 rounded border border-amber-200 space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-800">
                        <span>Existing Claim: <strong>{potentialDuplicates[0].claim.claimNumber}</strong> ({potentialDuplicates[0].claim.date})</span>
                        <span className="font-bold text-amber-900">${potentialDuplicates[0].claim.amount.toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Vendor: <strong>{potentialDuplicates[0].claim.merchantName}</strong> · Submitter: {potentialDuplicates[0].claim.employeeName}
                      </div>
                      <div className="text-[10px] text-amber-900 italic">
                        Signals: {potentialDuplicates[0].reasons.join(' · ')}
                      </div>
                    </div>

                    {/* Acknowledgment Override Checkbox */}
                    <label className="flex items-start gap-2 pt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={acknowledgedDuplicate}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setAcknowledgedDuplicate(val);
                          logAuditEvent(
                            'DUPLICATE_CHECK',
                            val ? 'Duplicate override acknowledged' : 'Duplicate override unacknowledged',
                            val ? 'User attested that this is a separate, distinct purchase.' : 'Duplicate caution active.'
                          );
                        }}
                        className="mt-0.5 rounded border-amber-400 text-amber-700 focus:ring-amber-500"
                      />
                      <span className="text-[11px] font-semibold text-amber-950">
                        I confirm this is a distinct, separate expense (e.g. repeated daily purchase) and not an accidental duplicate claim.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* POLICY ASSESSMENT RESULTS BANNER */}
            {isViolation ? (
              <div className="p-3.5 bg-red-50 border-2 border-red-300 rounded-lg text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-950 text-sm">
                        POLICY LIMIT VIOLATION DETECTED
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-red-100 text-red-800 border border-red-200">
                        Exceeds {simulatedGrade} Cap
                      </span>
                    </div>

                    <div className="p-2.5 bg-white/90 rounded border border-red-200 grid grid-cols-3 gap-2 font-mono text-center">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Claimed (Converted)</span>
                        <span className="font-bold text-slate-900">${policyEvaluationAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Grade Policy Limit</span>
                        <span className="font-bold text-slate-900">${(policyAssessment.maxAllowedAmount || 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-red-600 uppercase block">Excess Amount</span>
                        <span className="font-bold text-red-700">+${(policyAssessment.excessAmount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-red-900 leading-relaxed font-medium">
                      {policyAssessment.explanation}
                    </p>
                    <p className="text-[11px] text-red-800">
                      This bill cannot be auto-authorized. A formal business justification is required below for manager exception review.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-3 rounded-lg border text-xs ${
                policyAssessment.status === 'eligible_auto_authorized'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}>
                <div className="flex items-start gap-2">
                  {policyAssessment.status === 'eligible_auto_authorized' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Policy Status: {policyAssessment.status === 'eligible_auto_authorized' ? 'In Policy (Auto-Authorization Ready)' : 'Manager Review Required'}
                      </span>
                      <span className="text-[10px] bg-white/70 px-1.5 py-0.2 rounded border border-slate-200/50">
                        Cap: ${(policyAssessment.maxAllowedAmount || 0).toFixed(2)} {homeCurrency} ({simulatedGrade})
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed">
                      {policyAssessment.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Exception justification field (highlighted in red border when in violation) */}
            {isViolation && (
              <div className="p-3 bg-red-50/50 rounded-lg border-2 border-red-300">
                <label className="block text-[11px] font-bold text-red-950 mb-1 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                  Mandatory Exception Justification (Required for {currentEmployee.managerName} sign-off)
                </label>
                <textarea
                  rows={2}
                  required
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  onBlur={() => {
                    if (exceptionReason.trim()) {
                      logAuditEvent('POLICY_FLAG', 'Exception justification provided', `Employee reason: "${exceptionReason}".`);
                    }
                  }}
                  placeholder="Explain the business context for exceeding the grade allowance..."
                  className="w-full text-xs border border-red-300 bg-white rounded-md p-2 focus:ring-1 focus:ring-red-500 focus:outline-hidden text-slate-800"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={generateAndDownloadExpensePDF}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Summary</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-xs font-semibold text-white rounded-md transition-colors shadow-xs ${
                    potentialDuplicates.length > 0 && !acknowledgedDuplicate
                      ? 'bg-amber-600 hover:bg-amber-700 opacity-90'
                      : isViolation
                      ? 'bg-amber-700 hover:bg-amber-800'
                      : 'bg-emerald-700 hover:bg-emerald-800'
                  }`}
                >
                  {potentialDuplicates.length > 0 && !acknowledgedDuplicate
                    ? 'Confirm Duplicate Warning to Submit'
                    : isViolation 
                    ? 'Submit for Manager Exception Review' 
                    : 'Submit & Auto-Authorize'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: AUDIT LOG & HISTORY TRAIL */}
        {/* ========================================================================= */}
        {activeModalTab === 'history' && (
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* History Header & PDF Download Action */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-700" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Expense Item Audit Ledger
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Timestamped log tracking initial OCR capture, manual edits, policy checks, currency conversions, and annotations.
                </p>
              </div>

              <button
                type="button"
                onClick={generateAndDownloadExpensePDF}
                disabled={isPdfGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md transition-colors shadow-xs self-start sm:self-auto shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isPdfGenerating ? 'Generating...' : 'Download PDF Report'}</span>
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setHistoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  historyFilter === 'ALL'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Events ({auditHistory.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('MANUAL_EDIT')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  historyFilter === 'MANUAL_EDIT'
                    ? 'bg-blue-700 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Manual Edits
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('POLICY_FLAG')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  historyFilter === 'POLICY_FLAG'
                    ? 'bg-amber-700 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Policy Flags
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('OCR_SCAN')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  historyFilter === 'OCR_SCAN'
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                OCR & Vision
              </button>
            </div>

            {/* Add User Annotation Section */}
            <form onSubmit={handleAddUserAnnotation} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                <span>Add Record-Keeping Annotation / Auditor Note:</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newAnnotation}
                  onChange={(e) => setNewAnnotation(e.target.value)}
                  placeholder="e.g. Verified client attendance list with account director..."
                  className="flex-1 text-xs border border-slate-200 rounded-md p-2 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors shrink-0"
                >
                  Add Log Entry
                </button>
              </div>
            </form>

            {/* Timestamped Timeline of Events */}
            <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {auditHistory
                .filter(event => historyFilter === 'ALL' || event.eventType === historyFilter)
                .map((event) => {
                  const isEdit = event.eventType === 'MANUAL_EDIT';
                  const isPolicy = event.eventType === 'POLICY_FLAG';
                  const isOcr = event.eventType === 'OCR_SCAN';
                  const isFx = event.eventType === 'FX_CONVERSION';
                  const isDup = event.eventType === 'DUPLICATE_CHECK';
                  const isTag = event.eventType === 'TAG_EVENT';

                  return (
                    <div key={event.id} className="relative pl-8 text-xs">
                      {/* Timeline dot */}
                      <span className={`absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-white ring-2 ${
                        isPolicy ? 'bg-amber-500 ring-amber-200' :
                        isEdit ? 'bg-blue-500 ring-blue-200' :
                        isOcr ? 'bg-emerald-500 ring-emerald-200' :
                        isFx ? 'bg-purple-500 ring-purple-200' :
                        isDup ? 'bg-cyan-500 ring-cyan-200' :
                        'bg-slate-500 ring-slate-200'
                      }`}></span>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 flex-wrap gap-1">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                            isPolicy ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                            isEdit ? 'bg-blue-100 text-blue-900 border border-blue-200' :
                            isOcr ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                            isFx ? 'bg-purple-100 text-purple-900 border border-purple-200' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {event.eventType.replace('_', ' ')}
                          </span>

                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>{event.timestamp}</span>
                          </div>
                        </div>

                        <div className="font-semibold text-slate-900 pt-0.5">
                          {event.summary}
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {event.details}
                        </p>

                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span>Actor: <strong className="text-slate-700">{event.actor}</strong></span>
                          {event.fieldChanged && (
                            <span className="font-mono text-slate-500">Field: {event.fieldChanged}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
