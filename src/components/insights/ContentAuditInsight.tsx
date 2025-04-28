
import { Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ContentAuditInsightProps {
  company: Company;
}

export const ContentAuditInsight = ({ company }: ContentAuditInsightProps) => {
  const contentAudit = company.insights?.contentAudit;
  
  return (
    <Card>
      <CardContent className="pt-6">
        {contentAudit ? (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Key Topics</h3>
              <div className="flex flex-wrap gap-2">
                {contentAudit.keyTopics.map((topic, index) => (
                  <Badge key={index} variant="outline">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Recent Content</h3>
              <ul className="list-disc pl-5 space-y-1">
                {contentAudit.recentContent.map((content, index) => (
                  <li key={index} className="text-sm">{content}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Content Gaps</h3>
              <ul className="list-disc pl-5 space-y-1">
                {contentAudit.contentGaps.map((gap, index) => (
                  <li key={index} className="text-sm">{gap}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No content audit information available.</p>
            <p className="text-sm text-gray-400 mt-2">
              Try scanning the company website to analyze their content.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
