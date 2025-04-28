
import { Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AwardsInsightProps {
  company: Company;
}

export const AwardsInsight = ({ company }: AwardsInsightProps) => {
  const awards = company.insights?.recentAwards || [];
  
  return (
    <Card>
      <CardContent className="pt-6">
        {awards.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium">Recent Awards & Recognition</h3>
            <div className="flex flex-wrap gap-2">
              {awards.map((award, index) => (
                <Badge key={index} className="text-sm py-1">
                  {award}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No awards or recognitions found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Try scanning the company website to find recent awards.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
