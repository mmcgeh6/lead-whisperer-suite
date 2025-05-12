
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import DebugConsole from "@/components/dev/DebugConsole";
import { SearchResultDisplay } from "@/components/leads/search/SearchResultDisplay";
import { SearchContainer } from "@/components/leads/search/SearchContainer";

const LeadSearchPage = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Lead Search</h1>
            <p className="text-gray-500 mt-2">
              Search for potential leads based on your criteria
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/leads">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Link>
          </Button>
        </div>
        
        <SearchContainer />
      </div>
      
      <DebugConsole />
    </Layout>
  );
};

export default LeadSearchPage;