
import { useState } from "react";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AwardsInsight } from "./AwardsInsight";
import { JobPostingsInsight } from "./JobPostingsInsight";
import { ContentAuditInsight } from "./ContentAuditInsight";
import { IdealClientInsight } from "./IdealClientInsight";
import { useToast } from "@/components/ui/use-toast";

interface CompanyInsightsProps {
  companyId: string;
}

export const CompanyInsights = ({ companyId }: CompanyInsightsProps) => {
  const { companies, updateCompany, scanWebsite } = useAppContext();
  const { toast } = useToast();
  const company = companies.find((c) => c.id === companyId);
  
  const [websiteUrl, setWebsiteUrl] = useState(company?.website || "");
  const [isScanning, setIsScanning] = useState(false);
  
  if (!company) {
    return <div>Company not found</div>;
  }
  
  const handleScanWebsite = async () => {
    setIsScanning(true);
    await scanWebsite(websiteUrl);
    setIsScanning(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Insights</CardTitle>
        <CardDescription>
          Intelligence gathered from various sources about {company.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Company website URL"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleScanWebsite} disabled={isScanning || !websiteUrl}>
              {isScanning ? "Scanning..." : "Scan Website"}
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="awards">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="awards">Awards</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="ideal-client">Fit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="awards">
            <AwardsInsight company={company} />
          </TabsContent>
          
          <TabsContent value="jobs">
            <JobPostingsInsight company={company} />
          </TabsContent>
          
          <TabsContent value="content">
            <ContentAuditInsight company={company} />
          </TabsContent>
          
          <TabsContent value="ideal-client">
            <IdealClientInsight company={company} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center">
          <Badge variant="outline" className="mr-2">Last Updated</Badge>
          <span className="text-sm text-gray-500">
            {new Date(company.updatedAt).toLocaleDateString()}
          </span>
        </div>
        <Button variant="outline">Export Insights</Button>
      </CardFooter>
    </Card>
  );
};
