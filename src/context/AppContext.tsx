import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Company, Contact, EmailTemplate, EmailConfig } from "../types";
import { mockContacts, mockEmailTemplates } from "../data/mockData";
import { toast } from "../components/ui/use-toast";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface AppContextType {
  companies: Company[];
  contacts: Contact[];
  emailTemplates: EmailTemplate[];
  emailConfig: EmailConfig | null;
  selectedCompany: Company | null;
  selectedContact: Contact | null;
  setSelectedCompany: (company: Company | null) => void;
  setSelectedContact: (contact: Contact | null) => void;
  addCompany: (company: Company) => void;
  updateCompany: (company: Company) => void;
  addContact: (contact: Omit<Contact, "id" | "createdAt" | "updatedAt">) => void;
  updateContact: (contact: Contact) => void;
  saveEmailConfig: (config: EmailConfig) => void;
  scanWebsite: (url: string) => Promise<void>;
  checkFacebookAds: (companyName: string) => Promise<void>;
  generateCallScript: (contactId: string) => string;
  sendEmail: (contactId: string, templateId: string, customVariables?: Record<string, string>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(mockEmailTemplates);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const { user } = useAuth();
  
  // Fetch companies from Supabase when the component mounts or when the user changes
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Transform the data to match the Company type
        const formattedCompanies = data.map(company => ({
          id: company.id,
          name: company.name,
          website: company.website || "",
          industry: company.industry || "",
          size: company.size || "",
          location: company.location || "",
          description: company.description || "",
          createdAt: company.created_at,
          updatedAt: company.updated_at,
          insights: {} // Initialize with empty insights object
        }));
        
        setCompanies(formattedCompanies);
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast({
          title: "Failed to load companies",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    };
    
    fetchCompanies();
  }, [user]);

  // Update the addCompany function to accept a Company type instead of Omit<Company>
  const addCompany = (company: Company) => {
    setCompanies(prevCompanies => [...prevCompanies, company]);
  };

  const updateCompany = (updatedCompany: Company) => {
    setCompanies(
      companies.map((company) =>
        company.id === updatedCompany.id ? updatedCompany : company
      )
    );
  };

  const addContact = (contactData: Omit<Contact, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newContact: Contact = {
      ...contactData,
      id: `contact-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setContacts([...contacts, newContact]);
    toast({
      title: "Contact Added",
      description: `${newContact.firstName} ${newContact.lastName} has been added to your contacts.`,
    });
  };

  const updateContact = (updatedContact: Contact) => {
    setContacts(
      contacts.map((contact) =>
        contact.id === updatedContact.id
          ? { ...updatedContact, updatedAt: new Date().toISOString() }
          : contact
      )
    );
    toast({
      title: "Contact Updated",
      description: `${updatedContact.firstName} ${updatedContact.lastName} has been updated.`,
    });
  };

  const saveEmailConfig = (config: EmailConfig) => {
    setEmailConfig(config);
    toast({
      title: "Email Configuration Saved",
      description: "Your SMTP settings have been updated.",
    });
  };

  // Simulate website scanning
  const scanWebsite = async (url: string) => {
    console.log(`Scanning website: ${url}`);
    toast({
      title: "Website Scan Initiated",
      description: `Scanning ${url} for insights. This may take a few moments.`,
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (selectedCompany) {
      const updatedCompany = { ...selectedCompany };
      
      // Simulate finding insights
      updatedCompany.insights = {
        ...updatedCompany.insights,
        recentAwards: ["Industry Innovation Award 2023"],
        contentAudit: {
          keyTopics: ["Digital Transformation", "Customer Experience", "Data Analytics"],
          recentContent: ["Enhancing Customer Experience with AI", "Data-Driven Decision Making"],
          contentGaps: ["Implementation strategies", "ROI measurement"],
        },
        jobPostings: [
          {
            title: "Marketing Director",
            description: "Lead our marketing initiatives and strategy.",
            location: "Remote",
            postedDate: new Date().toISOString(),
            url: `${url}/careers/marketing-director`,
          }
        ],
        idealClient: Math.random() > 0.3, // Random determination for demo
        suggestedApproach: "Focus on their digital transformation initiatives and how our platform can provide better data insights.",
      };
      
      updateCompany(updatedCompany);
      
      toast({
        title: "Website Scan Complete",
        description: "New insights have been gathered and saved to the company profile.",
      });
    }
  };

  // Simulate checking Facebook ads
  const checkFacebookAds = async (companyName: string) => {
    console.log(`Checking Facebook ads for: ${companyName}`);
    toast({
      title: "Facebook Ad Check Initiated",
      description: `Checking if ${companyName} is running Facebook ads.`,
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (selectedCompany) {
      const updatedCompany = { ...selectedCompany };
      
      // Random result for demo purposes
      const isRunningAds = Math.random() > 0.5;
      
      updatedCompany.insights = {
        ...updatedCompany.insights,
        runningFacebookAds: isRunningAds,
        adDetails: isRunningAds 
          ? "Running targeted campaigns for business decision-makers." 
          : "",
      };
      
      updateCompany(updatedCompany);
      
      toast({
        title: "Facebook Ad Check Complete",
        description: isRunningAds 
          ? `${companyName} is currently running Facebook ads.` 
          : `No Facebook ads found for ${companyName}.`,
      });
    }
  };

  // Generate call script based on contact and company information
  const generateCallScript = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return "Contact not found.";
    
    const company = companies.find(c => c.id === contact.companyId);
    if (!company) return "Company information not available.";
    
    let script = `Call Script for ${contact.firstName} ${contact.lastName}, ${contact.title} at ${company.name}\n\n`;
    script += `Introduction: "Hello ${contact.firstName}, this is [Your Name] from [Your Company]. How are you today?"\n\n`;
    
    if (company.insights) {
      const { insights } = company;
      
      // Add personalized elements based on available insights
      if (insights.recentAwards && insights.recentAwards.length > 0) {
        script += `Congratulate on recent achievement: "I noticed that ${company.name} recently received ${insights.recentAwards[0]}. Congratulations on that achievement!"\n\n`;
      }
      
      if (insights.jobPostings && insights.jobPostings.length > 0) {
        script += `Reference hiring: "I see you're currently hiring for ${insights.jobPostings[0].title}. It looks like you're expanding your ${insights.jobPostings[0].title.includes('Marketing') ? 'marketing' : 'team'}."\n\n`;
      }
      
      if (insights.contentAudit?.keyTopics) {
        script += `Reference content focus: "I noticed from your website that ${company.name} is focused on ${insights.contentAudit.keyTopics.join(", ")}. That's actually why I'm calling..."\n\n`;
      }
      
      if (insights.suggestedApproach) {
        script += `Value proposition: "${insights.suggestedApproach}"\n\n`;
      }
    }
    
    script += `Ask for meeting: "I'd love to schedule a brief 15-minute call to discuss how we might be able to help ${company.name}. Would you have time this week for a quick conversation?"\n\n`;
    
    script += `Handle objections:\n`;
    script += `- If busy: "I understand you're busy. When would be a better time to have this conversation?"\n`;
    script += `- If not interested: "May I ask what solutions you're currently using for [problem your product solves]?"\n\n`;
    
    script += `Close: "Thank you for your time, ${contact.firstName}. I'll [follow-up action] and look forward to speaking with you soon."\n\n`;
    
    // Update contact with this script
    const updatedContact = { ...contact };
    updatedContact.notes = updatedContact.notes + `\n\nCall Script Generated on ${new Date().toLocaleDateString()}:\n${script}`;
    updateContact(updatedContact);
    
    return script;
  };

  // Simulate sending an email
  const sendEmail = async (contactId: string, templateId: string, customVariables?: Record<string, string>) => {
    if (!emailConfig) {
      toast({
        title: "Email Configuration Missing",
        description: "Please configure your SMTP settings first.",
        variant: "destructive",
      });
      return;
    }
    
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      toast({
        title: "Contact Not Found",
        description: "The selected contact could not be found.",
        variant: "destructive",
      });
      return;
    }
    
    const template = emailTemplates.find(t => t.id === templateId);
    if (!template) {
      toast({
        title: "Email Template Not Found",
        description: "The selected template could not be found.",
        variant: "destructive",
      });
      return;
    }
    
    const company = companies.find(c => c.id === contact.companyId);
    if (!company) {
      toast({
        title: "Company Not Found",
        description: "The associated company could not be found.",
        variant: "destructive",
      });
      return;
    }
    
    console.log(`Sending email to ${contact.email} using template ${template.name}`);
    toast({
      title: "Sending Email",
      description: `Sending email to ${contact.firstName} ${contact.lastName}.`,
    });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, we would send the email via API here
    // For now, just log what would be sent
    
    let subject = template.subject;
    let body = template.body;
    
    // Replace variables in template
    const variables = {
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: company.name,
      industry: company.industry,
      ...customVariables,
    };
    
    // Replace variables in subject and body
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(placeholder, value);
      body = body.replace(placeholder, value);
    }
    
    console.log("Email Subject:", subject);
    console.log("Email Body:", body);
    
    toast({
      title: "Email Sent",
      description: `Email successfully sent to ${contact.firstName} ${contact.lastName}.`,
    });
    
    // Update contact with a record of this email
    const updatedContact = { ...contact };
    updatedContact.notes += `\n\nEmail sent on ${new Date().toLocaleDateString()}:\nSubject: ${subject}`;
    updateContact(updatedContact);
  };

  return (
    <AppContext.Provider value={{
      companies,
      contacts,
      emailTemplates,
      emailConfig,
      selectedCompany,
      selectedContact,
      setSelectedCompany,
      setSelectedContact,
      addCompany,
      updateCompany,
      addContact,
      updateContact,
      saveEmailConfig,
      scanWebsite,
      checkFacebookAds,
      generateCallScript,
      sendEmail,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
