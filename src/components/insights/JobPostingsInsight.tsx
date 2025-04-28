
import { Company } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface JobPostingsInsightProps {
  company: Company;
}

export const JobPostingsInsight = ({ company }: JobPostingsInsightProps) => {
  const jobPostings = company.insights?.jobPostings || [];
  
  return (
    <Card>
      <CardContent className="pt-6">
        {jobPostings.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium">Recent Job Postings</h3>
            <div className="space-y-4">
              {jobPostings.map((job, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">{job.title}</h4>
                    <Badge variant="outline">
                      {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{job.location}</p>
                  <p className="text-sm mt-2">{job.description}</p>
                  {job.url && (
                    <a 
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      View job posting
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No job postings found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Try scanning the company website to find recent job listings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
