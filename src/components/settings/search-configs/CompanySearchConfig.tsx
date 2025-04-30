
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface CompanySearchParams {
  keywords: string[];
  location: string;
  employeeSizeRanges: string[];
  buyingSignals: string[];
  keywordFields: string[];
}

export const CompanySearchConfig = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState<CompanySearchParams>({
    keywords: [],
    location: "United States",
    employeeSizeRanges: [],
    buyingSignals: [],
    keywordFields: ["tags", "name", "seo_description"],
  });
  
  const [keywordInput, setKeywordInput] = useState("");
  const [apiEndpoint, setApiEndpoint] = useState("https://api.apollo.io/v1/companies/search");
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
  
  const buyingSignalOptions = [
    { label: "Automation Solutions", value: "6806671bec32050001c84f8f" },
    { label: "21-50 employees", value: "6806671bec32050001c84f88" },
    { label: "Digital Transformation", value: "6806671bec32050001c84f8e" },
    { label: "Financial Services industry", value: "6806671bec32050001c84f87" },
    { label: "Information Technology Services", value: "6806671bec32050001c84f86" },
    { label: "Nonprofit Organization", value: "6806671bec32050001c84f85" },
    { label: "Recent funding", value: "6806671bec32050001c84f8b" },
    { label: "Rapid growth", value: "643daa3f9293c1cdaa4d00fa" },
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

  const toggleEmployeeRange = (range: string) => {
    if (searchParams.employeeSizeRanges.includes(range)) {
      setSearchParams({
        ...searchParams,
        employeeSizeRanges: searchParams.employeeSizeRanges.filter(r => r !== range)
      });
    } else {
      setSearchParams({
        ...searchParams,
        employeeSizeRanges: [...searchParams.employeeSizeRanges, range]
      });
    }
  };

  const toggleBuyingSignal = (signal: string) => {
    if (searchParams.buyingSignals.includes(signal)) {
      setSearchParams({
        ...searchParams,
        buyingSignals: searchParams.buyingSignals.filter(s => s !== signal)
      });
    } else {
      setSearchParams({
        ...searchParams,
        buyingSignals: [...searchParams.buyingSignals, signal]
      });
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);

    try {
      // Build Apollo.io search URL from parameters
      let searchUrl = new URL("https://app.apollo.io/#/companies");
      
      // Add existence requirements
      searchUrl.searchParams.append("existFields[]", "organization_id");
      
      // Add location
      if (searchParams.location) {
        searchUrl.searchParams.append("organizationLocations[]", searchParams.location);
      }
      
      // Add keywords
      searchParams.keywords.forEach(keyword => {
        searchUrl.searchParams.append("qOrganizationKeywordTags[]", keyword);
      });
      
      // Add keyword fields
      searchParams.keywordFields.forEach(field => {
        searchUrl.searchParams.append("includedOrganizationKeywordFields[]", field);
      });
      
      // Add employee ranges
      searchParams.employeeSizeRanges.forEach(range => {
        searchUrl.searchParams.append("organizationNumEmployeesRanges[]", range);
      });
      
      // Add buying signals
      searchParams.buyingSignals.forEach(signal => {
        searchUrl.searchParams.append("searchSignalIds[]", signal);
      });
      
      // Additional parameters
      searchUrl.searchParams.append("page", "1");
      searchUrl.searchParams.append("sortByField", "[none]");
      searchUrl.searchParams.append("sortAscending", "false");
      
      // For demo purpose, we'll just display the formed URL
      console.log("Search URL:", searchUrl.toString());
      
      toast({
        title: "Company Search Configuration",
        description: "Search configuration has been saved. Ready to search!",
      });
      
      // In a real implementation, you would call your API endpoint
      // const response = await fetch(apiEndpoint, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({
      //     apolloSearchUrl: searchUrl.toString(),
      //   }),
      // });
      
    } catch (error) {
      console.error("Error configuring search:", error);
      toast({
        title: "Search Configuration Error",
        description: "Failed to save company search configuration.",
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
                onCheckedChange={() => toggleEmployeeRange(option.value)}
              />
              <Label htmlFor={`size-${option.value}`}>{option.label}</Label>
            </div>
          ))}
        </div>
      </Card>

      {/* Buying Signals */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Buying Signals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buyingSignalOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`signal-${option.value}`}
                checked={searchParams.buyingSignals.includes(option.value)}
                onCheckedChange={() => toggleBuyingSignal(option.value)}
              />
              <Label htmlFor={`signal-${option.value}`}>{option.label}</Label>
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
          buyingSignals: [],
          keywordFields: ["tags", "name", "seo_description"],
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
