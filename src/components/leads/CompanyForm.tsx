
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  phone: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  linkedin_url: z.string().optional(),
  facebook_url: z.string().optional(),
  twitter_url: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: any;
  isEditing?: boolean;
}

export const CompanyForm = ({ company, isEditing = false }: CompanyFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: company ? {
      name: company.name || "",
      website: company.website || "",
      industry: company.industry || "",
      size: company.size || "",
      location: company.location || "",
      description: company.description || "",
      phone: company.phone || "",
      street: company.street || "",
      city: company.city || "",
      state: company.state || "",
      zip: company.zip || "",
      country: company.country || "",
      linkedin_url: company.linkedin_url || "",
      facebook_url: company.facebook_url || "",
      twitter_url: company.twitter_url || "",
    } : {
      name: "",
      website: "",
      industry: "",
      size: "",
      location: "",
      description: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      linkedin_url: "",
      facebook_url: "",
      twitter_url: "",
    },
  });
  
  const onSubmit = async (values: CompanyFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to save companies.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log("Submitting company form with values:", values);
      console.log("Current user:", user.id);
      
      if (isEditing && company) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update({
            name: values.name,
            website: values.website || '',
            industry: values.industry || '',
            size: values.size || '',
            location: values.location || '',
            description: values.description || '',
            phone: values.phone || '',
            street: values.street || '',
            city: values.city || '',
            state: values.state || '',
            zip: values.zip || '',
            country: values.country || '',
            linkedin_url: values.linkedin_url || '',
            facebook_url: values.facebook_url || '',
            twitter_url: values.twitter_url || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', company.id)
          .eq('user_id', user.id); // Ensure user can only update their own companies
        
        if (error) {
          console.error("Error updating company:", error);
          throw error;
        }
        
        toast({
          title: "Company Updated",
          description: `${values.name} has been updated successfully.`
        });
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert({
            name: values.name,
            website: values.website || '',
            industry: values.industry || '',
            size: values.size || '',
            location: values.location || '',
            description: values.description || '',
            phone: values.phone || '',
            street: values.street || '',
            city: values.city || '',
            state: values.state || '',
            zip: values.zip || '',
            country: values.country || '',
            linkedin_url: values.linkedin_url || '',
            facebook_url: values.facebook_url || '',
            twitter_url: values.twitter_url || '',
            user_id: user.id, // Associate with current user
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (error) {
          console.error("Error creating company:", error);
          throw error;
        }
        
        console.log("Company created successfully:", data);
        
        toast({
          title: "Company Added",
          description: `${values.name} has been added successfully.`
        });
      }
      
      // Navigate back to leads page
      navigate("/leads");
    } catch (error) {
      console.error("Error saving company:", error);
      toast({
        title: "Failed to save company",
        description: error instanceof Error ? error.message : "There was an error saving your company. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    navigate("/leads");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Company" : "Add New Company"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
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
                      <Input placeholder="https://example.com" {...field} />
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
                      <Input placeholder="Technology, Healthcare, etc." {...field} />
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
                      <Input placeholder="1-10, 11-50, 51-200, etc." {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
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
                    <FormLabel>State</FormLabel>
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
                    <FormLabel>ZIP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="94102" {...field} />
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
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/company/acme" {...field} />
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
                      <Input placeholder="https://facebook.com/acme" {...field} />
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
                      <Input placeholder="https://twitter.com/acme" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the company..."
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
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : isEditing ? "Update Company" : "Add Company"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
