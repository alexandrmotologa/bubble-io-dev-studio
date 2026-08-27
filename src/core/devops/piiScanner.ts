import { BubbleSchema, PiiAuditReport, PiiCategory, PiiFinding, PiiRiskSeverity } from '../../types';

interface PiiRule {
  category: PiiCategory;
  severity: PiiRiskSeverity;
  pattern: RegExp;
  description: string;
  recommendation: string;
}

const PII_RULES: PiiRule[] = [
  {
    category: 'CREDENTIALS',
    severity: 'CRITICAL',
    pattern: /(?:password|passwd|pwd|token|api[_-]?key|secret|auth[_-]?token|private[_-]?key|access[_-]?token|refresh[_-]?token)/i,
    description: 'Field name matches authentication credential pattern. Storing plain credentials or exposed tokens creates severe account takeover vulnerability.',
    recommendation: 'In Bubble Privacy Rules: Set this field to "No one" access. Never expose credentials via the Data API or client-side searches.'
  },
  {
    category: 'FINANCIAL',
    severity: 'CRITICAL',
    pattern: /(?:credit[_-]?card|card[_-]?number|cvv|cvc|iban|bank[_-]?account|routing[_-]?number|swift[_-]?code|pan)/i,
    description: 'Field matches sensitive financial payment/banking data pattern (PCI-DSS compliance violation risk).',
    recommendation: 'Never store raw card details in Bubble DB. Use Stripe Elements / tokenized payment providers and restrict any bank info to "This User" only.'
  },
  {
    category: 'GOVERNMENT_ID',
    severity: 'HIGH',
    pattern: /(?:passport|national[_-]?id|ssn|social[_-]?security|driver[_-]?licen[sc]e|tax[_-]?id|ein|nin)/i,
    description: 'Field matches government identification number (GDPR/HIPAA/CCPA high sensitivity PII).',
    recommendation: 'In Bubble Privacy Rules: Restrict field view permission strictly to "This User" and Admin roles only.'
  },
  {
    category: 'BIOMETRIC',
    severity: 'HIGH',
    pattern: /(?:biometric|fingerprint|face[_-]?id|retina|voice[_-]?print)/i,
    description: 'Field matches biometric identification data.',
    recommendation: 'Biometric identifiers require explicit user consent under GDPR/CCPA. Protect with zero public Data API access.'
  },
  {
    category: 'CONTACT_PII',
    severity: 'HIGH',
    pattern: /(?:email|phone|mobile|telephone|cell|address|street|postal[_-]?code|zip[_-]?code|date[_-]?of[_-]?birth|dob|birth[_-]?date)/i,
    description: 'Field matches personal contact and demographic PII.',
    recommendation: 'In Bubble Privacy Rules: Ensure "Everyone else" cannot view or search these fields. Grant access only when "Current User is This User".'
  },
  {
    category: 'MEDICAL',
    severity: 'HIGH',
    pattern: /(?:diagnosis|medical|patient|prescription|health[_-]?record|symptom|doctor|disease|therapy)/i,
    description: 'Field matches Protected Health Information (PHI) under HIPAA/GDPR health data regulations.',
    recommendation: 'Audit for HIPAA compliance. Ensure rigorous data encryption and strict privacy rules granting access only to authorized medical roles.'
  },
  {
    category: 'GEOLOCATION',
    severity: 'MEDIUM',
    pattern: /(?:gps|latitude|longitude|coords|coordinates|location[_-]?lat|location[_-]?lng|geo[_-]?point)/i,
    description: 'Field matches precise geographic coordinate location data.',
    recommendation: 'Ensure real-time tracking data is not queryable without user authorization. Restrict location history.'
  },
  {
    category: 'DEMOGRAPHICS',
    severity: 'MEDIUM',
    pattern: /(?:salary|income|wage|gender|sex|ethnicity|race|religion|marital[_-]?status|political)/i,
    description: 'Field matches sensitive personal or demographic attributes.',
    recommendation: 'Restrict visibility to the account owner. Avoid returning sensitive demographic fields in broad repeating groups.'
  }
];

export class PiiScanner {
  /**
   * Scans a BubbleSchema for potentially exposed PII fields and security risks
   */
  public static scanSchema(schema: BubbleSchema): PiiAuditReport {
    const findings: PiiFinding[] = [];

    for (const dt of schema.dataTypes) {
      for (const field of dt.fields) {
        for (const rule of PII_RULES) {
          if (rule.pattern.test(field.name)) {
            findings.push({
              id: `pii_${dt.name}_${field.name}_${rule.category}`,
              table: dt.name,
              field: field.name,
              type: field.type,
              severity: rule.severity,
              category: rule.category,
              description: rule.description,
              recommendation: rule.recommendation
            });
            break; // Matched highest priority rule for this field
          }
        }
      }
    }

    const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = findings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = findings.filter(f => f.severity === 'MEDIUM').length;

    return {
      scannedAt: new Date().toISOString(),
      appName: schema.appName,
      environment: schema.version,
      totalTypes: schema.dataTypes.length,
      totalFields: schema.dataTypes.reduce((acc, dt) => acc + dt.fields.length, 0),
      criticalCount,
      highCount,
      mediumCount,
      findings
    };
  }

  /**
   * Scans a raw JSON array or records object for PII field keys
   */
  public static scanJsonRecords(tableName: string, records: Record<string, any>[]): PiiFinding[] {
    const findings: PiiFinding[] = [];
    if (!records || records.length === 0) return findings;

    const sample = records[0];
    const keys = Object.keys(sample);

    for (const key of keys) {
      for (const rule of PII_RULES) {
        if (rule.pattern.test(key)) {
          findings.push({
            id: `pii_record_${tableName}_${key}`,
            table: tableName,
            field: key,
            type: typeof sample[key],
            severity: rule.severity,
            category: rule.category,
            description: rule.description,
            recommendation: rule.recommendation
          });
          break;
        }
      }
    }

    return findings;
  }
}
