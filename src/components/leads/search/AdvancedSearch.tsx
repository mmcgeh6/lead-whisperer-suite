
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

interface AdvancedSearchProps {
  type: 'people' | 'companies';
  onSearch: (params: any) => void;
  isSearching: boolean;
}

export const AdvancedSearch = ({ type, onSearch, isSearching }: AdvancedSearchProps) => {
  const [keywords, setKeywords] = useState<string>("");
  const [location, setLocation] = useState<string>("United States");
  const [departments, setDepartments] = useState<string[]>([]);
  const [seniorities, setSeniorities] = useState<string[]>([]);
  const [employeeRanges, setEmployeeRanges] = useState<string[]>([]);
  const [emailStatus, setEmailStatus] = useState<string[]>([]);

  // Department options
  const departmentOptions = [
    { value: "c_suite", label: "C-Suite" },
    { value: "product_management", label: "Product Management" },
    { value: "master_engineering_technical", label: "Engineering & Technical" },
    { value: "design", label: "Design" },
    { value: "master_finance", label: "Finance" },
    { value: "master_human_resources", label: "Human Resources" },
    { value: "master_marketing", label: "Marketing" },
    { value: "master_sales", label: "Sales" },
    { value: "consulting", label: "Consulting" },
  ];

  // Seniority options
  const seniorityOptions = [
    { value: "c_suite", label: "C-Suite" },
    { value: "vp", label: "VP" },
    { value: "director", label: "Director" },
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

  // Email status options
  const emailStatusOptions = [
    { value: "verified", label: "Verified" },
    { value: "unverified", label: "Unverified" },
  ];

  const handleToggleDepartment = (value: string) => {
    setDepartments(prev => 
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

  const handleToggleEmailStatus = (value: string) => {
    setEmailStatus(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const handleSearch = () => {
    const keywordArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const searchParams = {
      type,
      keywords: keywordArray,
      location,
      departments,
      seniorities,
      employeeRanges,
      emailStatus,
    };

    onSearch(searchParams);
  };

  const handleReset = () => {
    setKeywords("");
    setLocation("United States");
    setDepartments([]);
    setSeniorities([]);
    setEmployeeRanges([]);
    setEmailStatus([]);
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
              {/* Employee count ranges */}
              <div>
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
              
              {/* People-specific fields */}
              {type === 'people' && (
                <>
                  {/* Departments */}
                  <div>
                    <Label className="block mb-2">Department</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {departmentOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dept-${option.value}`}
                            checked={departments.includes(option.value)}
                            onCheckedChange={() => handleToggleDepartment(option.value)}
                          />
                          <Label htmlFor={`dept-${option.value}`}>{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Seniorities */}
                  <div>
                    <Label className="block mb-2">Seniority Level</Label>
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
                  
                  {/* Email status */}
                  <div>
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
                </>
              )}
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
              Search {type === 'people' ? 'People' : 'Companies'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
