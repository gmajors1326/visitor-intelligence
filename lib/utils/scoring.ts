import type { Visitor } from '@/lib/db/schema';

export interface ScoreFactors {
  pageViews: number;
  timeOnSite: number; // in seconds
  isReturning: boolean;
  hasConsent: boolean;
  isHotSession: boolean;
  uniquePages: number;
}

export function calculateVisitorScore(factors: ScoreFactors): number {
  let score = 0;
  
  // Base score for page views
  score += Math.min(factors.pageViews * 10, 50);
  
  // Time on site bonus
  if (factors.timeOnSite > 60) score += 20;
  if (factors.timeOnSite > 300) score += 30;
  if (factors.timeOnSite > 600) score += 50;
  
  // Returning visitor bonus
  if (factors.isReturning) score += 30;
  
  // Consent given bonus (shows engagement)
  if (factors.hasConsent) score += 25;
  
  // Hot session multiplier
  if (factors.isHotSession) score += 40;
  
  // Unique pages bonus
  score += Math.min(factors.uniquePages * 15, 60);
  
  return Math.min(score, 300); // Cap at 300
}

export function isHotSession(score: number, pageViews: number, timeOnSite: number): boolean {
  // Hot session criteria:
  // - Score > 150 OR
  // - Page views > 10 OR
  // - Time on site > 10 minutes
  return score > 150 || pageViews > 10 || timeOnSite > 600;
}

export function calculateSessionScore(visitors: Visitor[]): number {
  if (visitors.length === 0) return 0;
  
  const pageViews = visitors.length;
  const uniquePages = new Set(visitors.map(v => v.url)).size;
  const firstVisit = visitors[0].createdAt;
  const lastVisit = visitors[visitors.length - 1].createdAt;
  const timeOnSite = Math.floor((lastVisit.getTime() - firstVisit.getTime()) / 1000);
  
  const factors: ScoreFactors = {
    pageViews,
    timeOnSite,
    isReturning: false, // Would need session history to determine
    hasConsent: visitors.some(v => v.consentGiven),
    isHotSession: false,
    uniquePages,
  };
  
  return calculateVisitorScore(factors);
}
