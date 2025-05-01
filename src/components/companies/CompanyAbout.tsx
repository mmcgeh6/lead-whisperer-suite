
import { Company } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompanyAboutProps {
  company: Company;
}

export const CompanyAbout = ({ company }: CompanyAboutProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About {company.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="whitespace-pre-line">
            {company.description || "No description available"}
          </p>
          
          {/* Social Links */}
          {(company.linkedin_url || company.facebook_url || company.twitter_url) && (
            <div className="pt-4">
              <h4 className="text-sm font-medium mb-2">Social Media Profiles</h4>
              <div className="flex flex-wrap gap-3">
                {company.linkedin_url && (
                  <a href={company.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                    LinkedIn
                  </a>
                )}
                {company.facebook_url && (
                  <a href={company.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                    Facebook
                  </a>
                )}
                {company.twitter_url && (
                  <a href={company.twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
                    Twitter
                  </a>
                )}
              </div>
            </div>
          )}
          
          {/* Complete Address */}
          {(company.street || company.city || company.state || company.zip || company.country) && (
            <div>
              <h4 className="text-sm font-medium mb-2">Address</h4>
              <address className="not-italic text-gray-600">
                {company.street && <p>{company.street}</p>}
                {company.city && company.state && <p>{company.city}, {company.state} {company.zip}</p>}
                {!company.city && company.state && <p>{company.state} {company.zip}</p>}
                {company.city && !company.state && <p>{company.city} {company.zip}</p>}
                {!company.city && !company.state && company.zip && <p>{company.zip}</p>}
                {company.country && <p>{company.country}</p>}
              </address>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
