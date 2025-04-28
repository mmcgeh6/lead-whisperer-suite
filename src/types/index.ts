
export interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  insights?: CompanyInsights;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface CompanyInsights {
  recentAwards?: string[];
  jobPostings?: JobPosting[];
  contentAudit?: ContentAudit;
  idealClient?: boolean;
  suggestedApproach?: string;
  runningFacebookAds?: boolean;
  adDetails?: string;
}

export interface JobPosting {
  title: string;
  description: string;
  location: string;
  postedDate: string;
  url: string;
}

export interface ContentAudit {
  keyTopics: string[];
  recentContent: string[];
  contentGaps: string[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
}
