export function calculateWebsiteScore(input: {
  websiteContent?: { statusCode?: number };
  sslStatus?: string;
  businessMatch?: boolean;
  domainAge?: number | null;
  policiesFound?: string[];
  complianceFlags?: { isRbiCompliant?: boolean; isPciDss?: boolean };
  anomalies?: string[];
}) {
  const breakdown = {
    baseScore: 0,
    sslScore: 0,
    businessMatchScore: 0,
    domainAgeScore: 0,
    policiesScore: 0,
    rbiComplianceScore: 0,
    pciComplianceScore: 0,
    anomaliesPenalty: 0,
    earnedPoints: [] as { category: string; points: number; reason: string }[],
    missedPoints: [] as { category: string; points: number; reason: string }[],
    summary: { found: [] as string[], notFound: [] as string[] },
  };

  if (input.websiteContent?.statusCode !== 200) {
    breakdown.missedPoints.push({
      category: 'Website Accessibility',
      points: 25,
      reason: 'Website is not accessible',
    });
    return { finalScore: 0, breakdown };
  }

  breakdown.baseScore = 25;
  breakdown.earnedPoints.push({
    category: 'Website Accessibility',
    points: 25,
    reason: 'HTTP 200',
  });

  if (input.sslStatus === 'Valid') {
    breakdown.sslScore = 15;
    breakdown.earnedPoints.push({
      category: 'SSL Certificate',
      points: 15,
      reason: 'Valid SSL',
    });
  } else {
    breakdown.missedPoints.push({
      category: 'SSL Certificate',
      points: 15,
      reason: 'Invalid/missing SSL',
    });
  }

  if (input.businessMatch) {
    breakdown.businessMatchScore = 20;
    breakdown.earnedPoints.push({
      category: 'Business Match',
      points: 20,
      reason: 'Matches merchant data',
    });
  } else {
    breakdown.missedPoints.push({
      category: 'Business Match',
      points: 20,
      reason: 'Does not match merchant',
    });
  }

  if (input.domainAge && input.domainAge > 365) {
    breakdown.domainAgeScore = 15;
    breakdown.earnedPoints.push({
      category: 'Domain Age',
      points: 15,
      reason: '> 1 year',
    });
  } else if (input.domainAge != null) {
    breakdown.domainAgeScore = 5;
    breakdown.earnedPoints.push({
      category: 'Domain Age',
      points: 5,
      reason: `${input.domainAge} days`,
    });
    breakdown.missedPoints.push({
      category: 'Domain Age',
      points: 10,
      reason: '< 1 year',
    });
  } else {
    breakdown.missedPoints.push({
      category: 'Domain Age',
      points: 15,
      reason: 'Unknown',
    });
  }

  const policies = input.policiesFound || [];
  if (policies.length >= 3) {
    breakdown.policiesScore = 25;
  } else if (policies.length > 0) {
    breakdown.policiesScore = 10;
  }

  if (breakdown.policiesScore) {
    breakdown.earnedPoints.push({
      category: 'Legal Policies',
      points: breakdown.policiesScore,
      reason: policies.join(', '),
    });
  } else {
    breakdown.missedPoints.push({
      category: 'Legal Policies',
      points: 25,
      reason: 'None found',
    });
  }

  if (input.complianceFlags?.isRbiCompliant) {
    breakdown.rbiComplianceScore = 15;
    breakdown.earnedPoints.push({
      category: 'Trust & Compliance',
      points: 15,
      reason: 'RBI Compliant',
    });
  }

  if (input.complianceFlags?.isPciDss) {
    breakdown.pciComplianceScore = 10;
    breakdown.earnedPoints.push({
      category: 'Trust & Compliance',
      points: 10,
      reason: 'PCI DSS',
    });
  }

  if (input.anomalies?.length) {
    breakdown.anomaliesPenalty = 50;
  }

  const totalEarned = breakdown.earnedPoints.reduce((s, i) => s + i.points, 0);
  const finalScore = Math.min(
    100,
    Math.max(0, totalEarned - breakdown.anomaliesPenalty),
  );

  return { finalScore, breakdown: { ...breakdown, totalEarned } };
}
