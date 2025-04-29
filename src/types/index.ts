
export interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  industry_vertical?: string;
  size: string;
  location: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  description: string;
  facebook_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
  insights?: CompanyInsights;
  call_script?: string;
  email_script?: string;
  text_script?: string;
  social_dm_script?: string;
  research_notes?: string;
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
  linkedin_url?: string;
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
