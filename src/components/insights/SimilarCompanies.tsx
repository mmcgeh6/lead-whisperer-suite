
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, ExternalLink, MapPin, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimilarCompany {
  name: string;
  linkedinUrl?: string;
  industry?: string;
  location?: string;
}

interface SimilarCompaniesProps {
  companies: SimilarCompany[];
}

export const SimilarCompanies: React.FC<SimilarCompaniesProps> = ({ companies }) => {
  if (!companies || companies.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Similar Companies
        </CardTitle>
        <CardDescription>
          Companies in the same industry or market segment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">LinkedIn</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    {company.name || "Unknown company"}
                  </div>
                </TableCell>
                <TableCell>
                  {company.industry || "Unknown industry"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {company.location || "Unknown location"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {company.linkedinUrl ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(company.linkedinUrl, "_blank")}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  ) : (
                    "Not available"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
