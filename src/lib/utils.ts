
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to detect if a name is likely a generic industry name
export const isIndustryName = (name: string): boolean => {
  if (!name) return false;
  const industryKeywords = [
    'roofing', 'construction', 'technology', 'healthcare', 'finance', 'marketing',
    'software', 'consulting', 'real estate', 'insurance', 'education', 'retail',
    'manufacturing', 'telecommunications', 'automotive', 'agriculture', 'energy',
    'entertainment', 'hospitality', 'logistics', 'media', 'nonprofit', 'pharmaceutical',
    'transportation', 'utilities', 'banking', 'legal', 'accounting', 'engineering',
    'advertising', 'architecture', 'biotechnology', 'chemicals', 'clothing',
    'communications', 'computers', 'defense', 'electronics', 'environmental',
    'food', 'government', 'industrial', 'internet', 'mining', 'oil', 'plastics',
    'publishing', 'restaurants', 'security', 'sports', 'textiles', 'tourism',
    'trading', 'wholesale'
  ];
  const lowerName = name.toLowerCase().trim();
  return industryKeywords.some(keyword => 
    lowerName.includes(keyword) && (name.length < 25 || lowerName === keyword)
  );
};
