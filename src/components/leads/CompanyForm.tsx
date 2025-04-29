
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Company } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const companySchema = z.object({
  name: z.string().min(1, "Name is required"),
  website: z.string().url("Please enter a valid URL").or(z.string().length(0)),
  industry: z.string().min(1, "Industry is required"),
  industry_vertical: z.string().optional(),
  size: z.string(),
  location: z.string(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  description: z.string(),
  facebook_url: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  twitter_url: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  linkedin_url: z.string().url("Please enter a valid URL").or(z.string().length(0)).optional(),
  keywords: z.string().optional().transform(val => 
    val ? val.split(',').map(keyword => keyword.trim()) : []
  ),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  initialData?: Company;
}

export const CompanyForm = ({ initialData }: CompanyFormProps) => {
  const { addCompany, updateCompany } = useAppContext();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: initialData ? {
      name: initialData.name,
      website: initialData.website || "",
      industry: initialData.industry || "",
      industry_vertical: initialData.industry_vertical || "",
      size: initialData.size || "",
      location: initialData.location || "",
      street: initialData.street || "",
      city: initialData.city || "",
      state: initialData.state || "",
      zip: initialData.zip || "",
      country: initialData.country || "",
      phone: initialData.phone || "",
      description: initialData.description || "",
      facebook_url: initialData.facebook_url || "",
      twitter_url: initialData.twitter_url || "",
      linkedin_url: initialData.linkedin_url || "",
      keywords: initialData.keywords ? initialData.keywords.join(', ') : "",
    } : {
      name: "",
      website: "",
      industry: "",
      industry_vertical: "",
      size: "",
      location: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
      description: "",
      facebook_url: "",
      twitter_url: "",
      linkedin_url: "",
      keywords: "",
    },
  });
  
  const onSubmit = async (values: CompanyFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (initialData) {
        // Update company in Supabase
        const { error } = await supabase
          .from('companies')
          .update({
            name: values.name,
            website: values.website,
            industry: values.industry,
            industry_vertical: values.industry_vertical,
            size: values.size,
            location: values.location,
            street: values.street,
            city: values.city,
            state: values.state,
            zip: values.zip,
            country: values.country,
            phone: values.phone,
            description: values.description,
            facebook_url: values.facebook_url,
            twitter_url: values.twitter_url,
            linkedin_url: values.linkedin_url,
            keywords: values.keywords,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        // Update local state
        const updatedCompany: Company = {
          ...initialData,
          ...values,
          updatedAt: new Date().toISOString()
        };
        
        updateCompany(updatedCompany);
        
        toast({
          title: "Company Updated",
          description: `${values.name} has been updated.`
        });
      } else {
        // Add new company to Supabase
        const { data, error } = await supabase
          .from('companies')
          .insert({
            name: values.name,
            website: values.website,
            industry: values.industry,
            industry_vertical: values.industry_vertical,
            size: values.size || "",
            location: values.location || "",
            street: values.street || "",
            city: values.city || "",
            state: values.state || "",
            zip: values.zip || "",
            country: values.country || "",
            phone: values.phone || "",
            description: values.description || "",
            facebook_url: values.facebook_url || "",
            twitter_url: values.twitter_url || "",
            linkedin_url: values.linkedin_url || "",
            keywords: values.keywords || []
          })
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          // Add to local state with the id from Supabase
          // Convert the data structure to match our Company type
          const newCompany: Company = {
            id: data[0].id,
            name: data[0].name,
            website: data[0].website || "",
            industry: data[0].industry || "",
            industry_vertical: data[0].industry_vertical || "",
            size: data[0].size || "",
            location: data[0].location || "",
            street: data[0].street || "",
            city: data[0].city || "",
            state: data[0].state || "",
            zip: data[0].zip || "",
            country: data[0].country || "",
            phone: data[0].phone || "",
            description: data[0].description || "",
            facebook_url: data[0].facebook_url || "",
            twitter_url: data[0].twitter_url || "",
            linkedin_url: data[0].linkedin_url || "",
            keywords: data[0].keywords || [],
            createdAt: data[0].created_at,
            updatedAt: data[0].updated_at,
            insights: {}
          };
          
          addCompany(newCompany);
          
          toast({
            title: "Company Added",
            description: `${values.name} has been added to your leads.`
          });
        }
      }
      
      navigate("/leads");
    } catch (error) {
      console.error("Error saving company:", error);
      toast({
        title: "Error",
        description: `Failed to save company. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Company" : "Add New Company"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="industry_vertical"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry Vertical</FormLabel>
                    <FormControl>
                      <Input placeholder="SaaS, FinTech, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <FormControl>
                      <Input placeholder="1-50, 51-200, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State/Province</FormLabel>
                      <FormControl>
                        <Input placeholder="CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP/Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="94105" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Location</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="linkedin_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.linkedin.com/company/example" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="facebook_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.facebook.com/example" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="twitter_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/example" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords (comma separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="b2b, software, enterprise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the company and its products/services"
                      rows={4}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/leads")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : initialData ? "Update Company" : "Add Company"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
