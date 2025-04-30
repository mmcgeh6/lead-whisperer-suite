
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AdminSetup } from "@/components/users/AdminSetup";

const Dashboard = () => {
  const { user, isAdmin } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-2">Welcome to your LeadGenius dashboard.</p>
        </div>

        {user && !isAdmin && (
          <div className="mb-6">
            <AdminSetup />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Manage your leads and prospects.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Outreach</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Create and manage your outreach campaigns.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Track your performance and insights.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
