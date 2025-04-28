
import { ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 px-6 mt-auto">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} LeadWhisperer. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-brand-600 flex items-center">
              Documentation
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-brand-600 flex items-center">
              Support
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-brand-600 flex items-center">
              Privacy Policy
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
