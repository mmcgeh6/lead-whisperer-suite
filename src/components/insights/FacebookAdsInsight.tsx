
import { Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/context/AppContext";

interface FacebookAdsInsightProps {
  company: Company;
}

export const FacebookAdsInsight = ({ company }: FacebookAdsInsightProps) => {
  const { checkFacebookAds } = useAppContext();
  const isRunningAds = company.insights?.runningFacebookAds;
  const adDetails = company.insights?.adDetails || "";
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Facebook Ad Campaigns</h3>
            <Badge variant={isRunningAds ? "default" : "outline"}>
              {isRunningAds ? "Active" : isRunningAds === false ? "No Campaigns" : "Unknown"}
            </Badge>
          </div>
          
          {isRunningAds ? (
            <div className="space-y-3">
              <p className="text-sm">{adDetails}</p>
              <a 
                href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&q=${encodeURIComponent(company.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline inline-block"
              >
                View in Facebook Ad Library →
              </a>
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-gray-500">
                {isRunningAds === false 
                  ? "No active Facebook ad campaigns detected." 
                  : "Facebook ad status unknown."}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Check the Facebook Ad Library to see if this company is running ads.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
