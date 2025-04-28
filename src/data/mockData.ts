
import { Company, Contact, EmailTemplate } from "../types";

export const mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechNova Solutions",
    website: "https://technovasolutions.com",
    industry: "Technology",
    size: "50-200",
    location: "San Francisco, CA",
    description: "Innovative software solutions for enterprise clients.",
    createdAt: new Date(2023, 5, 15).toISOString(),
    updatedAt: new Date(2023, 9, 20).toISOString(),
    insights: {
      recentAwards: ["Best Workplace 2023", "Innovation Award 2023"],
      jobPostings: [
        {
          title: "Senior Software Engineer",
          description: "Looking for experienced React developers.",
          location: "San Francisco, CA",
          postedDate: new Date(2023, 9, 5).toISOString(),
          url: "https://technovasolutions.com/careers/senior-software-engineer",
        },
        {
          title: "Product Manager",
          description: "Lead our product development team.",
          location: "Remote",
          postedDate: new Date(2023, 9, 10).toISOString(),
          url: "https://technovasolutions.com/careers/product-manager",
        },
      ],
      contentAudit: {
        keyTopics: ["Digital Transformation", "Cloud Migration", "DevOps"],
        recentContent: [
          "How to Scale Your Cloud Infrastructure",
          "The Future of DevOps in Enterprise",
        ],
        contentGaps: ["Security best practices", "Cost optimization"],
      },
      idealClient: true,
      suggestedApproach: "Focus on their cloud migration challenges and how our platform can streamline their processes.",
      runningFacebookAds: true,
      adDetails: "Running awareness campaigns targeting IT decision-makers.",
    },
  },
  {
    id: "2",
    name: "GreenLeaf Marketing",
    website: "https://greenleafmarketing.com",
    industry: "Marketing",
    size: "10-50",
    location: "Austin, TX",
    description: "Digital marketing agency specializing in sustainability.",
    createdAt: new Date(2023, 6, 20).toISOString(),
    updatedAt: new Date(2023, 8, 10).toISOString(),
    insights: {
      recentAwards: ["Agency of the Year 2023"],
      jobPostings: [
        {
          title: "Social Media Manager",
          description: "Create and manage social media campaigns.",
          location: "Austin, TX",
          postedDate: new Date(2023, 8, 15).toISOString(),
          url: "https://greenleafmarketing.com/careers/social-media-manager",
        },
      ],
      contentAudit: {
        keyTopics: ["Sustainable Marketing", "Brand Development", "Digital Strategy"],
        recentContent: [
          "Sustainability in Digital Marketing",
          "Building Green Brands",
        ],
        contentGaps: ["Marketing ROI metrics", "B2B marketing strategies"],
      },
      idealClient: true,
      suggestedApproach: "Emphasize our platform's analytics and ROI tracking capabilities.",
      runningFacebookAds: false,
      adDetails: "",
    },
  },
  {
    id: "3",
    name: "Vertex Finance",
    website: "https://vertexfinance.com",
    industry: "Financial Services",
    size: "200-500",
    location: "New York, NY",
    description: "Financial consulting and wealth management.",
    createdAt: new Date(2023, 3, 10).toISOString(),
    updatedAt: new Date(2023, 7, 5).toISOString(),
    insights: {
      recentAwards: [],
      jobPostings: [
        {
          title: "Financial Analyst",
          description: "Analyze market trends and provide investment advice.",
          location: "New York, NY",
          postedDate: new Date(2023, 7, 1).toISOString(),
          url: "https://vertexfinance.com/careers/financial-analyst",
        },
        {
          title: "Client Relationship Manager",
          description: "Manage relationships with high-net-worth individuals.",
          location: "Boston, MA",
          postedDate: new Date(2023, 7, 2).toISOString(),
          url: "https://vertexfinance.com/careers/client-relationship-manager",
        },
      ],
      contentAudit: {
        keyTopics: ["Wealth Management", "Retirement Planning", "Tax Strategy"],
        recentContent: [
          "Navigating Market Volatility",
          "Estate Planning Essentials",
        ],
        contentGaps: ["Crypto investments", "Sustainable investing"],
      },
      idealClient: false,
      suggestedApproach: "Highlight our secure data handling and compliance features.",
      runningFacebookAds: true,
      adDetails: "Running targeted campaigns for retirement planning services.",
    },
  },
];

export const mockContacts: Contact[] = [
  {
    id: "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@technovasolutions.com",
    phone: "415-555-1234",
    title: "Chief Technology Officer",
    companyId: "1",
    createdAt: new Date(2023, 5, 20).toISOString(),
    updatedAt: new Date(2023, 9, 25).toISOString(),
    notes: "Met at Tech Conference 2023. Interested in improving their dev workflow.",
  },
  {
    id: "2",
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@technovasolutions.com",
    phone: "415-555-5678",
    title: "VP of Engineering",
    companyId: "1",
    createdAt: new Date(2023, 6, 5).toISOString(),
    updatedAt: new Date(2023, 8, 15).toISOString(),
    notes: "Reports to Sarah. Focused on cloud migration projects.",
  },
  {
    id: "3",
    firstName: "Jessica",
    lastName: "Martinez",
    email: "jessica@greenleafmarketing.com",
    phone: "512-555-9876",
    title: "CEO",
    companyId: "2",
    createdAt: new Date(2023, 7, 10).toISOString(),
    updatedAt: new Date(2023, 9, 5).toISOString(),
    notes: "Founder. Looking to scale operations in Q1 2024.",
  },
  {
    id: "4",
    firstName: "Robert",
    lastName: "Williams",
    email: "robert.williams@vertexfinance.com",
    phone: "212-555-4321",
    title: "Director of Operations",
    companyId: "3",
    createdAt: new Date(2023, 4, 15).toISOString(),
    updatedAt: new Date(2023, 8, 20).toISOString(),
    notes: "Decision-maker for technology purchases. Concerned about data security.",
  },
];

export const mockEmailTemplates: EmailTemplate[] = [
  {
    id: "1",
    name: "Initial Outreach",
    subject: "Helping {{company}} achieve growth objectives",
    body: `Hi {{firstName}},

I noticed that {{company}} recently {{recentActivity}}. Congratulations!

Based on your focus on {{keyTopics}}, I thought you might be interested in how our platform could help you {{benefitStatement}}.

Would you be available for a quick 15-minute call this week to discuss how we might help {{company}} with {{painPoint}}?

Best regards,
Your Name`,
    variables: ["firstName", "company", "recentActivity", "keyTopics", "benefitStatement", "painPoint"],
  },
  {
    id: "2",
    name: "Follow-up Email",
    subject: "Following up on {{company}}'s {{specificNeed}}",
    body: `Hi {{firstName}},

I wanted to follow up on my previous email regarding how we could help {{company}} with {{specificNeed}}.

I thought you might be interested in this case study about how we helped a similar {{industry}} company increase their efficiency by 30%: [Case Study Link]

If you'd like to discuss how we could achieve similar results for {{company}}, I'm available for a call this week.

Best regards,
Your Name`,
    variables: ["firstName", "company", "specificNeed", "industry"],
  },
  {
    id: "3",
    name: "Job Posting Response",
    subject: "Regarding your {{jobTitle}} opening at {{company}}",
    body: `Hi {{firstName}},

I noticed that {{company}} is currently hiring for a {{jobTitle}} position, which suggests you might be scaling your {{department}} team.

Many companies we work with find that our platform helps new team members onboard faster and become productive more quickly, especially in the {{department}} department.

Would you be interested in a brief demo to see how we could help your growing team?

Best regards,
Your Name`,
    variables: ["firstName", "company", "jobTitle", "department"],
  },
];
