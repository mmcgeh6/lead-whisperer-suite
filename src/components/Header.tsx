
import { Link } from "react-router-dom";
import { UserMenu } from "./UserMenu";

export const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <Link to="/" className="text-xl font-bold">
            CRM Pro
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium hover:text-primary">
            Dashboard
          </Link>
          <Link to="/leads" className="text-sm font-medium hover:text-primary">
            Leads
          </Link>
          <Link to="/outreach" className="text-sm font-medium hover:text-primary">
            Outreach
          </Link>
          <Link to="/settings" className="text-sm font-medium hover:text-primary">
            Settings
          </Link>
        </nav>
        
        <div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
