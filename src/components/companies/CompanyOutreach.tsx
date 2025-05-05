
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PersonalizedOutreach } from "@/components/outreach/PersonalizedOutreach";

interface CompanyOutreachProps {
  companyName: string;
}

export const CompanyOutreach = ({ companyName }: CompanyOutreachProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Personalized Outreach</CardTitle>
      </CardHeader>
      <CardContent>
        <PersonalizedOutreach companyName={companyName} />
      </CardContent>
    </Card>
  );
};
