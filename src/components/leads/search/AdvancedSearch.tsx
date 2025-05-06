import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Search } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { DepartmentFilterGroup } from "./DepartmentFilterGroup";

interface SearchParams {
  keywords: string[];
  location: string;
  emailStatus: string[];
  departments: string[];
  seniorities: string[];
  employeeRanges: string[];
  resultCount: number;
  organizationLocations: string[];
  keywordFields: string[];
}

interface AdvancedSearchProps {
  onSearch: (params: SearchParams) => void;
  isSearching: boolean;
}

export const AdvancedSearch = ({ onSearch, isSearching }: AdvancedSearchProps) => {
  const [keywords, setKeywords] = useState<string>("");
  const [location, setLocation] = useState<string>("United States");
  const [emailStatus, setEmailStatus] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [seniorities, setSeniorities] = useState<string[]>([]);
  const [employeeRanges, setEmployeeRanges] = useState<string[]>([]);
  const [organizationLocations, setOrganizationLocations] = useState<string[]>([]);
  const [resultCount, setResultCount] = useState<string>("20");

  // Email status options
  const emailStatusOptions = [
    { value: "verified", label: "Verified" },
    { value: "unverified", label: "Unverified" },
  ];
  
  // Seniority options
  const seniorityOptions = [
    { value: "c_suite", label: "C-Suite" },
    { value: "vp", label: "VP" },
    { value: "director", label: "Director" },
    { value: "head", label: "Head" },
    { value: "owner", label: "Owner" },
    { value: "founder", label: "Founder" },
    { value: "partner", label: "Partner" },
    { value: "manager", label: "Manager" },
    { value: "senior", label: "Senior Individual Contributor" },
    { value: "entry", label: "Entry Level" },
  ];

  // Employee ranges
  const employeeRangeOptions = [
    { value: "1,10", label: "1-10" },
    { value: "11,20", label: "11-20" },
    { value: "21,50", label: "21-50" },
    { value: "51,100", label: "51-100" },
    { value: "101,200", label: "101-200" },
    { value: "201,500", label: "201-500" },
    { value: "501,1000", label: "501-1,000" },
    { value: "1001,2000", label: "1,001-2,000" },
    { value: "2001,5000", label: "2,001-5,000" },
    { value: "5001,10000", label: "5,001-10,000" },
    { value: "10001", label: "10,001+" },
  ];
  
  // Result count options
  const resultCountOptions = [
    { value: "10", label: "10 results" },
    { value: "20", label: "20 results" },
    { value: "50", label: "50 results" },
    { value: "100", label: "100 results" },
  ];

  // Department filter groups
  const departmentGroups = [
    {
      label: "C-Suite",
      defaultValue: "c_suite",
      options: [
        { label: "Executive", value: "executive" },
        { label: "Finance Executive", value: "finance_executive" },
        { label: "Founder", value: "founder" },
        { label: "Human Resources Executive", value: "human_resources_executive" },
        { label: "Information Technology Executive", value: "information_technology_executive" },
        { label: "Legal Executive", value: "legal_executive" },
        { label: "Marketing Executive", value: "marketing_executive" },
        { label: "Medical & Health Executive", value: "medical_health_executive" },
        { label: "Operations Executive", value: "operations_executive" },
        { label: "Sales Leader", value: "sales_executive" },
      ],
    },
    {
      label: "Product",
      defaultValue: "product_management",
      options: [
        { label: "Product Management", value: "product_mangement" },
        { label: "Product Development", value: "product_development" },
      ],
    },
    {
      label: "Engineering & Technical",
      defaultValue: "master_engineering_technical",
      options: [
        { label: "Artificial Intelligence / Machine Learning", value: "artificial_intelligence_machine_learning" },
        { label: "Bioengineering", value: "bioengineering" },
        { label: "Biometrics", value: "biometrics" },
        { label: "Business Intelligence", value: "business_intelligence" },
        { label: "Chemical Engineering", value: "chemical_engineering" },
        { label: "Cloud / Mobility", value: "cloud_mobility" },
        { label: "Data Science", value: "data_science" },
        { label: "DevOps", value: "devops" },
        { label: "Digital Transformation", value: "digital_transformation" },
        { label: "Emerging Technology / Innovation", value: "emerging_technology_innovation" },
        { label: "Engineering & Technical", value: "engineering_technical" },
        { label: "Industrial Engineering", value: "industrial_engineering" },
        { label: "Mechanic", value: "mechanic" },
        { label: "Mobile Development", value: "mobile_development" },
        { label: "Project Management", value: "project_management" },
        { label: "Research & Development", value: "research_development" },
        { label: "Scrum Master / Agile Coach", value: "scrum_master_agile_coach" },
        { label: "Software Development", value: "software_development" },
        { label: "Support / Technical Services", value: "support_technical_services" },
        { label: "Technician", value: "technician" },
        { label: "Technology Operations", value: "technology_operations" },
        { label: "Test / Quality Assurance", value: "test_quality_assurance" },
        { label: "UI / UX", value: "ui_ux" },
        { label: "Web Development", value: "web_development" },
      ],
    },
    {
      label: "Design",
      defaultValue: "design",
      options: [
        { label: "All Design", value: "all_design" },
        { label: "Product or UI/UX Design", value: "product_ui_ux_design" },
        { label: "Graphic / Visual / Brand Design", value: "graphic_design" },
      ],
    },
    {
      label: "Education",
      defaultValue: "education",
      options: [
        { label: "Teacher", value: "teacher" },
        { label: "Principal", value: "principal" },
        { label: "Superintendent", value: "superintendent" },
        { label: "Professor", value: "professor" },
      ],
    },
    {
      label: "Finance",
      defaultValue: "master_finance",
      options: [
        { label: "Accounting", value: "accounting" },
        { label: "Finance", value: "finance" },
        { label: "Financial Planning & Analysis", value: "financial_planning_analysis" },
        { label: "Financial Reporting", value: "financial_reporting" },
        { label: "Financial Strategy", value: "financial_strategy" },
        { label: "Financial Systems", value: "financial_systems" },
        { label: "Internal Audit & Control", value: "internal_audit_control" },
        { label: "Investor Relations", value: "investor_relations" },
        { label: "Mergers & Acquisitions", value: "mergers_acquisitions" },
        { label: "Real Estate Finance", value: "real_estate_finance" },
        { label: "Financial Risk", value: "financial_risk" },
        { label: "Shared Services", value: "shared_services" },
        { label: "Sourcing / Procurement", value: "sourcing_procurement" },
        { label: "Tax", value: "tax" },
        { label: "Treasury", value: "treasury" },
      ],
    },
    {
      label: "Human Resources",
      defaultValue: "master_human_resources",
      options: [
        { label: "Compensation & Benefits", value: "compensation_benefits" },
        { label: "Culture, Diversity & Inclusion", value: "culture_diversity_inclusion" },
        { label: "Employee & Labor Relations", value: "employee_labor_relations" },
        { label: "Health & Safety", value: "health_safety" },
        { label: "Human Resource Information System", value: "human_resource_information_system" },
        { label: "Human Resources", value: "human_resources" },
        { label: "HR Business Partner", value: "hr_business_partner" },
        { label: "Learning & Development", value: "learning_development" },
        { label: "Organizational Development", value: "organizational_development" },
        { label: "Recruiting & Talent Acquisition", value: "recruiting_talent_acquisition" },
        { label: "Talent Management", value: "talent_management" },
        { label: "Workforce Management", value: "workforce_mangement" },
        { label: "People Operations", value: "people_operations" },
      ],
    },
    {
      label: "Information Technology",
      defaultValue: "master_information_technology",
      options: [
        { label: "Application Development", value: "application_development" },
        { label: "Business Service Management / ITSM", value: "business_service_management_itsm" },
        { label: "Collaboration / Web App", value: "collaboration_web_app" },
        { label: "Data Center", value: "data_center" },
        { label: "Data Warehouse", value: "data_warehouse" },
        { label: "Database Administration", value: "database_administration" },
        { label: "Ecommerce Development", value: "ecommerce_development" },
        { label: "Enterprise Architecture", value: "enterprise_architecture" },
        { label: "Help Desk / Desktop Services", value: "help_desk_desktop_services" },
        { label: "HR Financial ERP Systems", value: "hr_financial_erp_systems" },
        { label: "Information Security", value: "information_security" },
        { label: "Information Technology", value: "information_technology" },
        { label: "Infrastructure", value: "infrastructure" },
        { label: "IT Asset Management", value: "it_asset_management" },
        { label: "IT Audit / IT Compliance", value: "it_audit_it_compliance" },
        { label: "IT Operations", value: "it_operations" },
        { label: "IT Procurement", value: "it_procurement" },
        { label: "IT Strategy", value: "it_strategy" },
        { label: "IT Training", value: "it_training" },
        { label: "Networking", value: "networking" },
        { label: "Project / Program Management", value: "project_program_management" },
        { label: "Quality Assurance", value: "quality_assurance" },
        { label: "Retail Store Systems", value: "retail_store_systems" },
        { label: "Servers", value: "servers" },
        { label: "Storage / Disaster Recovery", value: "storage_disaster_recovery" },
        { label: "Telecommunications", value: "telecommunications" },
        { label: "Virtualization", value: "virtualization" },
      ],
    },
    {
      label: "Legal",
      defaultValue: "master_legal",
      options: [
        { label: "Acquisitions", value: "acquisitions" },
        { label: "Compliance", value: "compliance" },
        { label: "Contracts", value: "contracts" },
        { label: "Corporate Secretary", value: "corporate_secretary" },
        { label: "eDiscovery", value: "ediscovery" },
        { label: "Ethics", value: "ethics" },
        { label: "Governance", value: "governance" },
        { label: "Governmental Affairs / Regulatory Law", value: "governmental_affairs_regulatory_law" },
        { label: "Intellectual Property / Patent", value: "intellectual_property_patent" },
        { label: "Labor / Employment", value: "labor_employment" },
        { label: "Lawyer / Attorney", value: "lawyer_attorney" },
        { label: "Legal", value: "legal" },
        { label: "Legal Counsel", value: "legal_counsel" },
        { label: "Legal Operations", value: "legal_operations" },
        { label: "Litigation", value: "litigation" },
        { label: "Privacy", value: "privacy" },
      ],
    },
    {
      label: "Marketing",
      defaultValue: "master_marketing",
      options: [
        { label: "Advertising", value: "advertising" },
        { label: "Brand Management", value: "brand_management" },
        { label: "Content Marketing", value: "content_marketing" },
        { label: "Customer Experience", value: "customer_experience" },
        { label: "Customer Marketing", value: "customer_marketing" },
        { label: "Demand Generation", value: "demand_generation" },
        { label: "Digital Marketing", value: "digital_marketing" },
        { label: "Ecommerce Marketing", value: "ecommerce_marketing" },
        { label: "Event Marketing", value: "event_marketing" },
        { label: "Field Marketing", value: "field_marketing" },
        { label: "Lead Generation", value: "lead_generation" },
        { label: "Marketing", value: "marketing" },
        { label: "Marketing Analytics & Insights", value: "marketing_analytics_insights" },
        { label: "Marketing Communications", value: "marketing_communications" },
        { label: "Marketing Operations", value: "marketing_operations" },
        { label: "Product Marketing", value: "product_marketing" },
        { label: "Public Relations", value: "public_relations" },
        { label: "Search Engine Optimization / Pay Per Click", value: "search_engine_optimization_pay_per_click" },
        { label: "Social Media Marketing", value: "social_media_marketing" },
        { label: "Strategic Communications", value: "strategic_communications" },
        { label: "Technical Marketing", value: "technical_marketing" },
      ],
    },
    {
      label: "Medical & Health",
      defaultValue: "medical_health",
      options: [
        { label: "Anesthesiology", value: "anesthesiology" },
        { label: "Chiropractics", value: "chiropractics" },
        { label: "Clinical Systems", value: "clinical_systems" },
        { label: "Dentistry", value: "dentistry" },
        { label: "Dermatology", value: "dermatology" },
        { label: "Doctors / Physicians", value: "doctors_physicians" },
        { label: "Epidemiology", value: "epidemiology" },
        { label: "First Responder", value: "first_responder" },
        { label: "Infectious Disease", value: "infectious_disease" },
        { label: "Medical Administration", value: "medical_administration" },
        { label: "Medical Education / Training", value: "medical_education_training" },
        { label: "Medical Research", value: "medical_research" },
        { label: "Medicine", value: "medicine" },
        { label: "Neurology", value: "neurology" },
        { label: "Nursing", value: "nursing" },
        { label: "Nutrition / Dietetics", value: "nutrition_dietetics" },
        { label: "Obstetrics / Gynecology", value: "obstetrics_gynecology" },
        { label: "Oncology", value: "oncology" },
        { label: "Ophthalmology", value: "opthalmology" },
        { label: "Optometry", value: "optometry" },
        { label: "Orthopedics", value: "orthopedics" },
        { label: "Pathology", value: "pathology" },
        { label: "Pediatrics", value: "pediatrics" },
        { label: "Pharmacy", value: "pharmacy" },
        { label: "Physical Therapy", value: "physical_therapy" },
        { label: "Psychiatry", value: "psychiatry" },
        { label: "Psychology", value: "psychology" },
        { label: "Public Health", value: "public_health" },
        { label: "Radiology", value: "radiology" },
        { label: "Social Work", value: "social_work" },
      ],
    },
    {
      label: "Operations",
      defaultValue: "master_operations",
      options: [
        { label: "Call Center", value: "call_center" },
        { label: "Construction", value: "construction" },
        { label: "Corporate Strategy", value: "corporate_strategy" },
        { label: "Customer Service / Support", value: "customer_service_support" },
        { label: "Enterprise Resource Planning", value: "enterprise_resource_planning" },
        { label: "Facilities Management", value: "facilities_management" },
        { label: "Leasing", value: "leasing" },
        { label: "Logistics", value: "logistics" },
        { label: "Office Operations", value: "office_operations" },
        { label: "Operations", value: "operations" },
        { label: "Physical Security", value: "physical_security" },
        { label: "Project Development", value: "project_development" },
        { label: "Quality Management", value: "quality_management" },
        { label: "Real Estate", value: "real_estate" },
        { label: "Safety", value: "safety" },
        { label: "Store Operations", value: "store_operations" },
        { label: "Supply Chain", value: "supply_chain" },
      ],
    },
    {
      label: "Sales",
      defaultValue: "master_sales",
      options: [
        { label: "Account Management", value: "account_management" },
        { label: "Business Development", value: "business_development" },
        { label: "Channel Sales", value: "channel_sales" },
        { label: "Customer Retention & Development", value: "customer_retention_development" },
        { label: "Customer Success", value: "customer_success" },
        { label: "Field / Outside Sales", value: "field_outside_sales" },
        { label: "Inside Sales", value: "inside_sales" },
        { label: "Partnerships", value: "partnerships" },
        { label: "Revenue Operations", value: "revenue_operations" },
        { label: "Sales", value: "sales" },
        { label: "Sales Enablement", value: "sales_enablement" },
        { label: "Sales Engineering", value: "sales_engineering" },
        { label: "Sales Operations", value: "sales_operations" },
        { label: "Sales Training", value: "sales_training" },
      ],
    },
    {
      label: "Consulting",
      defaultValue: "consulting",
      options: [
        { label: "Consultant", value: "consulting" },
      ],
    },
  ];

  // Helper functions for handling checkbox toggles
  const handleToggleEmailStatus = (value: string) => {
    setEmailStatus(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleToggleSeniority = (value: string) => {
    setSeniorities(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleToggleEmployeeRange = (value: string) => {
    setEmployeeRanges(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleDepartmentsChange = (newDepartments: string[]) => {
    setDepartments(newDepartments);
  };

  const handleSearch = () => {
    const keywordArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    // Process department selections - use default values for fully selected groups
    const processedDepartments: string[] = [];
    
    departmentGroups.forEach(group => {
      const selectedInGroup = group.options
        .filter(opt => departments.includes(opt.value))
        .map(opt => opt.value);
        
      if (selectedInGroup.length > 0) {
        // If all options in the group are selected, use the default value
        if (selectedInGroup.length === group.options.length) {
          processedDepartments.push(group.defaultValue);
        } else {
          // Otherwise add individual selections
          processedDepartments.push(...selectedInGroup);
        }
      }
    });
    
    // Always include the location as an organization location
    let allCompanyLocations = organizationLocations.slice();
    if (location && !allCompanyLocations.includes(location)) {
      allCompanyLocations = [location];
    }
    
    const searchParams = {
      keywords: keywordArray,
      location,
      emailStatus,
      departments: processedDepartments,
      seniorities,
      employeeRanges,
      resultCount: parseInt(resultCount, 10),
      organizationLocations: allCompanyLocations,
      // We're including all keyword fields automatically now
      keywordFields: ["tags", "name", "seo_description", "social_media_description"]
    };

    console.log("Search params:", searchParams);
    onSearch(searchParams);
  };

  const handleReset = () => {
    setKeywords("");
    setLocation("United States");
    setEmailStatus([]);
    setDepartments([]);
    setSeniorities([]);
    setEmployeeRanges([]);
    setOrganizationLocations([]);
    setResultCount("20");
  };

  return (
    <div className="space-y-6">
      {/* Basic search fields */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="keywords">Keywords (Comma separated)</Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords e.g., roofing, contractor, residential"
          />
        </div>
        
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Country or region e.g., United States"
          />
        </div>
        
        <div>
          <Label htmlFor="resultCount">Number of Results</Label>
          <Select
            value={resultCount}
            onValueChange={setResultCount}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent>
              {resultCountOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Advanced filters */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced-filters">
          <AccordionTrigger>
            <div className="flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              {/* Email Status */}
              <div className="space-y-2">
                <Label className="block mb-2">Email Status</Label>
                <div className="flex gap-4">
                  {emailStatusOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`email-status-${option.value}`}
                        checked={emailStatus.includes(option.value)}
                        onCheckedChange={() => handleToggleEmailStatus(option.value)}
                      />
                      <Label htmlFor={`email-status-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department & Job Function */}
              <div className="space-y-2">
                <Label className="block mb-2">Department & Job Function</Label>
                <div className="max-h-80 overflow-y-auto border rounded-md p-4">
                  {departmentGroups.map((group) => (
                    <DepartmentFilterGroup
                      key={group.label}
                      label={group.label}
                      defaultValue={group.defaultValue}
                      options={group.options}
                      selectedValues={departments}
                      onChange={handleDepartmentsChange}
                    />
                  ))}
                </div>
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <Label className="block mb-2">Job Title</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {seniorityOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`seniority-${option.value}`}
                        checked={seniorities.includes(option.value)}
                        onCheckedChange={() => handleToggleSeniority(option.value)}
                      />
                      <Label htmlFor={`seniority-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Company Location */}
              <div className="space-y-2">
                <Label className="block mb-2">Company Location</Label>
                <Input
                  type="text"
                  placeholder="Add company location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mb-2"
                />
              </div>

              {/* Employee count ranges */}
              <div className="space-y-2">
                <Label className="block mb-2">Company Size (Employees)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {employeeRangeOptions.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`employee-range-${option.value}`}
                        checked={employeeRanges.includes(option.value)}
                        onCheckedChange={() => handleToggleEmployeeRange(option.value)}
                      />
                      <Label htmlFor={`employee-range-${option.value}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Search and reset buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" onClick={handleReset}>
          Reset Filters
        </Button>
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? "Searching..." : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search People
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
