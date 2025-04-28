
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Index = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white">
      <header className="py-6 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
          LeadWhisperer
        </h1>
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-gray-600 hover:text-brand-600 transition-colors">Features</a>
          <a href="#how-it-works" className="text-gray-600 hover:text-brand-600 transition-colors">How It Works</a>
          <Button onClick={() => navigate("/dashboard")}>Get Started</Button>
        </nav>
        <Button variant="outline" className="md:hidden" onClick={() => navigate("/dashboard")}>
          Get Started
        </Button>
      </header>
      
      <main>
        {/* Hero Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Convert Research Into <span className="text-brand-600">Actionable Insights</span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            The intelligent B2B lead generation platform that goes beyond contact information to deliver personalized insights and outreach strategies.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/dashboard")}>
              Start Generating Leads
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")}>
              View Demo
            </Button>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-16">Key Features</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 shadow-md">
                <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-3">Intelligent Web Scraping</h4>
                <p className="text-gray-600">
                  Extract valuable information from company websites including recent awards, job postings, and content focus areas.
                </p>
              </Card>
              
              <Card className="p-8 shadow-md">
                <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-3">Personalized Outreach</h4>
                <p className="text-gray-600">
                  Generate customized email templates and call scripts based on gathered insights for higher response rates.
                </p>
              </Card>
              
              <Card className="p-8 shadow-md">
                <div className="h-12 w-12 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-3">Comprehensive Analytics</h4>
                <p className="text-gray-600">
                  Track your outreach efforts and gain valuable insights into what's working and what needs improvement.
                </p>
              </Card>
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-16">How It Works</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-brand-600 text-white rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Add Leads</h4>
                <p className="text-gray-600">
                  Import company information or add them manually to start building your database.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-brand-600 text-white rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Gather Insights</h4>
                <p className="text-gray-600">
                  Scan websites and social profiles to gather valuable company insights.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-brand-600 text-white rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Personalize Outreach</h4>
                <p className="text-gray-600">
                  Create personalized emails and call scripts based on the gathered insights.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-brand-600 text-white rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl font-bold">4</span>
                </div>
                <h4 className="text-lg font-semibold mb-2">Convert Leads</h4>
                <p className="text-gray-600">
                  Use personalized approaches to increase response rates and conversions.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-12">
              <Button size="lg" onClick={() => navigate("/dashboard")}>
                Get Started Now
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-12 px-6 bg-white border-t">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent mb-4">
              LeadWhisperer
            </h3>
            <p className="text-gray-600">
              The intelligent B2B lead generation and outreach platform.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Features</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Web Scraping</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Personalized Outreach</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Email Templates</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Call Scripts</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Documentation</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">API</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Tutorials</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Help Center</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Contact Us</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-600 hover:text-brand-600">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-gray-100 text-center">
          <p className="text-gray-500">
            &copy; {new Date().getFullYear()} LeadWhisperer. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
