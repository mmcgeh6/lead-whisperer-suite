
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
  website: z.string().url("Please enter a valid URL"),
  industry: z.string().min(1, "Industry is required"),
  size: z.string(),
  location: z.string(),
  description: z.string(),
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
      website: initialData.website,
      industry: initialData.industry,
      size: initialData.size,
      location: initialData.location,
      description: initialData.description,
    } : {
      name: "",
      website: "",
      industry: "",
      size: "",
      location: "",
      description: "",
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
            size: values.size,
            location: values.location,
            description: values.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        // Update local state
        updateCompany({
          ...initialData,
          ...values,
        });
        
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
            size: values.size || "",
            location: values.location || "",
            description: values.description || ""
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
            size: data[0].size || "",
            location: data[0].location || "",
            description: data[0].description || "",
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
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="San Francisco, CA" {...field} />
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
