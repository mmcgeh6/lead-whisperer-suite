
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      navigate('/auth');
    } catch (error) {
      console.error("Sign out failed:", error);
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-gray-800">
          LeadGenius
        </Link>
        <nav className="hidden md:flex space-x-4">
          <Link to="/dashboard" className="text-gray-600 hover:text-gray-800">
            Dashboard
          </Link>
          <Link to="/leads" className="text-gray-600 hover:text-gray-800">
            Leads
          </Link>
          <Link to="/leads/search" className="text-gray-600 hover:text-gray-800">
            Lead Search
          </Link>
          <Link to="/outreach" className="text-gray-600 hover:text-gray-800">
            Outreach
          </Link>
          {isAdmin && (
            <>
              <Link to="/settings" className="text-gray-600 hover:text-gray-800">
                Settings
              </Link>
              <Link to="/users" className="text-gray-600 hover:text-gray-800">
                Users
              </Link>
            </>
          )}
        </nav>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none focus:outline-none rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email}`} alt={user.email} />
                  <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                Profile
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/users')}>
                    User Management
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth" className="text-blue-600 hover:text-blue-800">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
