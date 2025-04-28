
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Company } from "@/types";

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Ideal Client</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id} onClick={() => handleCompanyClick(company)} className="cursor-pointer hover:bg-gray-50">
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.industry}</TableCell>
                  <TableCell>{company.location}</TableCell>
                  <TableCell>
                    {company.insights?.idealClient !== undefined ? (
                      <Badge variant={company.insights.idealClient ? "default" : "outline"}>
                        {company.insights.idealClient ? "Yes" : "No"}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Unknown</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompanyClick(company);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
