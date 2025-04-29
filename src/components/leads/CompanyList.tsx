
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Company } from "@/types";
import { Search } from "lucide-react";

export const CompanyList = () => {
  const { companies, setSelectedCompany } = useAppContext();
  const navigate = useNavigate();
  
  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    navigate(`/leads/${company.id}`);
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Companies</CardTitle>
        <Button size="sm" onClick={() => navigate("/leads/new")}>
          Add Company
        </Button>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No companies added yet.</p>
            <Button className="mt-4" onClick={() => navigate("/leads/new")}>
              Add Your First Company
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((company) => (
              <Card 
                key={company.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCompanyClick(company)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg truncate">{company.name}</h3>
                    <Badge variant={company.insights?.idealClient ? "default" : "outline"}>
                      {company.insights?.idealClient ? "Ideal" : "Potential"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    {company.industry} • {company.location}
                  </div>
                  <div className="text-sm mb-4 line-clamp-2 text-gray-600">
                    {company.description || "No description available"}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      Added {formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompanyClick(company);
                      }}
                    >
                      <Search className="h-4 w-4" /> View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
