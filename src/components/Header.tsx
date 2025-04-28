
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm h-16 flex items-center px-6">
      <div className="flex-1 flex items-center">
        <h1 
          className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent cursor-pointer"
          onClick={() => navigate("/")}
        >
          LeadWhisperer
        </h1>
      </div>
      <nav className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/leads")}
        >
          Leads
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/outreach")}
        >
          Outreach
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/settings")}
        >
          Settings
        </Button>
      </nav>
    </header>
  );
};
