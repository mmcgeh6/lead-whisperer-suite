
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface PeopleSearchParams {
  keywords: string[];
  location: string;
  employeeSizeRanges: string[];
  seniorities: string[];
  departments: string[];
  emailStatus: string[];
}

export const PeopleSearchConfig = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<PeopleSearchParams>({
    keywords: [],
    location: "United States",
    employeeSizeRanges: [],
    seniorities: [],
    departments: [],
    emailStatus: ["verified"]
  });
  
  const [keywordInput, setKeywordInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const employeeRangeOptions = [
    { label: "1-10 employees", value: "1,10" },
    { label: "11-20 employees", value: "11,20" },
    { label: "21-50 employees", value: "21,50" },
    { label: "51-100 employees", value: "51,100" },
    { label: "101-200 employees", value: "101,200" },
    { label: "201-500 employees", value: "201,500" },
    { label: "501-1000 employees", value: "501,1000" },
    { label: "1001-2000 employees", value: "1001,2000" },
    { label: "2001-5000 employees", value: "2001,5000" },
    { label: "5001-10000 employees", value: "5001,10000" },
    { label: "10001+ employees", value: "10001" },
  ];
  
  const seniorityOptions = [
    { label: "C-Suite", value: "c_suite" },
    { label: "VP", value: "vp" },
    { label: "Director", value: "director" },
    { label: "Head", value: "head" },
    { label: "Manager", value: "manager" },
    { label: "Senior", value: "senior" },
    { label: "Entry", value: "entry" },
    { label: "Owner", value: "owner" },
    { label: "Founder", value: "founder" },
    { label: "Partner", value: "partner" },
  ];
  
  const departmentOptions = [
    { label: "C-Suite", value: "c_suite" },
    { label: "Sales", value: "master_sales" },
    { label: "Marketing", value: "master_marketing" },
    { label: "Engineering", value: "master_engineering_technical" },
    { label: "Product", value: "product_management" },
    { label: "Design", value: "design" },
    { label: "Finance", value: "master_finance" },
    { label: "HR", value: "master_human_resources" },
    { label: "IT", value: "master_information_technology" },
    { label: "Legal", value: "master_legal" },
    { label: "Operations", value: "master_operations" },
    { label: "Education", value: "education" },
    { label: "Medical/Health", value: "medical_health" },
    { label: "Consulting", value: "consulting" },
  ];
  
  const emailStatusOptions = [
    { label: "Verified emails", value: "verified" },
    { label: "Unverified emails", value: "unverified" },
  ];

  const addKeyword = () => {
    if (keywordInput && !searchParams.keywords.includes(keywordInput)) {
      setSearchParams({
        ...searchParams,
        keywords: [...searchParams.keywords, keywordInput]
      });
      setKeywordInput("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setSearchParams({
      ...searchParams,
      keywords: searchParams.keywords.filter(k => k !== keyword)
    });
  };

  const toggleArrayValue = (array: keyof PeopleSearchParams, value: string) => {
    const currentArray = searchParams[array] as string[];
    
    if (currentArray.includes(value)) {
      setSearchParams({
        ...searchParams,
        [array]: currentArray.filter(item => item !== value)
      });
    } else {
      setSearchParams({
        ...searchParams,
        [array]: [...currentArray, value]
      });
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);

    try {
      // Build Apollo.io search URL from parameters
      let searchUrl = new URL("https://app.apollo.io/#/people");
      
      // Add seniorities
      searchParams.seniorities.forEach(seniority => {
        searchUrl.searchParams.append("personSeniorities[]", seniority);
      });
      
      // Add departments
      searchParams.departments.forEach(department => {
        searchUrl.searchParams.append("personDepartmentOrSubdepartments[]", department);
      });
      
      // Add existence requirements
      searchUrl.searchParams.append("existFields[]", "organization_id");
      
      // Add location
      if (searchParams.location) {
        searchUrl.searchParams.append("organizationLocations[]", searchParams.location);
      }
      
      // Add keywords for company search
      searchParams.keywords.forEach(keyword => {
        searchUrl.searchParams.append("qOrganizationKeywordTags[]", keyword);
      });
      
      // Add keyword fields
      ["tags", "name", "seo_description"].forEach(field => {
        searchUrl.searchParams.append("includedOrganizationKeywordFields[]", field);
      });
      
      // Add employee ranges
      searchParams.employeeSizeRanges.forEach(range => {
        searchUrl.searchParams.append("organizationNumEmployeesRanges[]", range);
      });
      
      // Add email status
      searchParams.emailStatus.forEach(status => {
        searchUrl.searchParams.append("contactEmailStatusV2[]", status);
      });
      
      // Add sorting params
      searchUrl.searchParams.append("sortAscending", "false");
      searchUrl.searchParams.append("sortByField", "[none]");
      searchUrl.searchParams.append("page", "1");
      
      // For demo purpose, we'll just display the formed URL
      console.log("People Search URL:", searchUrl.toString());
      
      toast({
        title: "People Search Configuration",
        description: "Search configuration has been saved. Ready to search!",
      });
      
      // In a real implementation, you would call your API endpoint
      
    } catch (error) {
      console.error("Error configuring search:", error);
      toast({
        title: "Search Configuration Error",
        description: "Failed to save people search configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords section */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Company Keywords</h3>
          <div className="flex gap-2 mb-4">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="Enter industry or keyword"
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            />
            <Button onClick={addKeyword}>Add</Button>
          </div>
          {searchParams.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {searchParams.keywords.map((keyword, index) => (
                <div key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full flex items-center gap-1">
                  {keyword}
                  <button 
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 rounded-full w-4 h-4 flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Location section */}
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Company Location</h3>
          <Input
            value={searchParams.location}
            onChange={(e) => setSearchParams({...searchParams, location: e.target.value})}
            placeholder="United States"
          />
        </Card>
      </div>

      {/* Company Size Ranges */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Company Size</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {employeeRangeOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`size-${option.value}`}
                checked={searchParams.employeeSizeRanges.includes(option.value)}
                onCheckedChange={() => toggleArrayValue("employeeSizeRanges", option.value)}
              />
              <Label htmlFor={`size-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Seniority Levels */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Management Level (Seniority)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {seniorityOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`seniority-${option.value}`}
                checked={searchParams.seniorities.includes(option.value)}
                onCheckedChange={() => toggleArrayValue("seniorities", option.value)}
              />
              <Label htmlFor={`seniority-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Departments */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Department</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {departmentOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`dept-${option.value}`}
                checked={searchParams.departments.includes(option.value)}
                onCheckedChange={() => toggleArrayValue("departments", option.value)}
              />
              <Label htmlFor={`dept-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Email Status */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Email Status</h3>
        <div className="flex gap-8">
          {emailStatusOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`email-${option.value}`}
                checked={searchParams.emailStatus.includes(option.value)}
                onCheckedChange={() => toggleArrayValue("emailStatus", option.value)}
              />
              <Label htmlFor={`email-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => setSearchParams({
          keywords: [],
          location: "United States",
          employeeSizeRanges: [],
          seniorities: [],
          departments: [],
          emailStatus: ["verified"]
        })}>
          Reset
        </Button>
        <Button onClick={handleSearch} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
};
