
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Company } from "@/types";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const companySchema = z.object({
  name: z.string().min(2, {
    message: "Company name must be at least 2 characters.",
  }),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  industry_vertical: z.string().optional().or(z.literal('')),
  size: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  street: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zip: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  facebook_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  twitter_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  linkedin_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  keywords: z.string().optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companySchema>;

interface CompanyFormProps {
  company?: Company;
  isEditing?: boolean;
}

export const CompanyForm = ({ company, isEditing }: CompanyFormProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Convert potential array of keywords to string for form display
  const convertKeywordsToString = (keywords?: string[] | null): string => {
    if (!keywords || !Array.isArray(keywords)) return '';
    return keywords.join(', ');
  };
  
  // Parse string of keywords back to array
  const parseKeywords = (keywordString?: string): string[] => {
    if (!keywordString) return [];
    return keywordString.split(',').map(k => k.trim()).filter(k => k);
  };

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || '',
      website: company?.website || '',
      industry: company?.industry || '',
      industry_vertical: company?.industry_vertical || '',
      size: company?.size || '',
      location: company?.location || '',
      street: company?.street || '',
      city: company?.city || '',
      state: company?.state || '',
      zip: company?.zip || '',
      country: company?.country || '',
      phone: company?.phone || '',
      description: company?.description || '',
      facebook_url: company?.facebook_url || '',
      twitter_url: company?.twitter_url || '',
      linkedin_url: company?.linkedin_url || '',
      // Convert keywords array to string for the form
      keywords: convertKeywordsToString(company?.keywords),
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || '',
        website: company.website || '',
        industry: company.industry || '',
        industry_vertical: company.industry_vertical || '',
        size: company.size || '',
        location: company.location || '',
        street: company.street || '',
        city: company.city || '',
        state: company.state || '',
        zip: company.zip || '',
        country: company.country || '',
        phone: company.phone || '',
        description: company.description || '',
        facebook_url: company.facebook_url || '',
        twitter_url: company.twitter_url || '',
        linkedin_url: company.linkedin_url || '',
        // Convert keywords array to string
        keywords: convertKeywordsToString(company.keywords),
      });
    }
  }, [company, form]);

  const onSubmit = async (values: CompanyFormValues) => {
    setIsSaving(true);

    try {
      const companyData = {
        ...values,
        // Convert empty strings to null for optional fields
        website: values.website === '' ? null : values.website,
        industry: values.industry === '' ? null : values.industry,
        industry_vertical: values.industry_vertical === '' ? null : values.industry_vertical,
        size: values.size === '' ? null : values.size,
        location: values.location === '' ? null : values.location,
        street: values.street === '' ? null : values.street,
        city: values.city === '' ? null : values.city,
        state: values.state === '' ? null : values.state,
        zip: values.zip === '' ? null : values.zip,
        country: values.country === '' ? null : values.country,
        phone: values.phone === '' ? null : values.phone,
        description: values.description === '' ? null : values.description,
        facebook_url: values.facebook_url === '' ? null : values.facebook_url,
        twitter_url: values.twitter_url === '' ? null : values.twitter_url,
        linkedin_url: values.linkedin_url === '' ? null : values.linkedin_url,
        // Ensure name is included and not null
        name: values.name,
        // Parse keywords string to array
        keywords: parseKeywords(values.keywords),
      };

      if (isEditing && company?.id) {
        // Update existing company
        const { error } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', company.id);

        if (error) throw error;

        toast({
          title: "Company updated",
          description: "Your company has been updated successfully.",
        });
      } else {
        // Create new company
        const { error } = await supabase
          .from('companies')
          .insert({
            ...companyData,
            id: crypto.randomUUID()
          });

        if (error) throw error;

        toast({
          title: "Company created",
          description: "Your company has been created successfully.",
        });
      }

      navigate('/leads');
    } catch (error) {
      console.error("Error creating/updating company:", error);
      toast({
        title: "Error",
        description: "Failed to create/update company. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Company" : "Add New Company"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
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
                    <Input placeholder="https://acme.com" {...field} />
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
                    <Input placeholder="Software" {...field} />
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
                    <Input placeholder="SaaS" {...field} />
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
                    <Input placeholder="11-50 employees" {...field} />
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
                  <FormLabel>Zip Code</FormLabel>
                  <FormControl>
                    <Input placeholder="94107" {...field} />
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
                    <Input placeholder="USA" {...field} />
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
                    <Input placeholder="+1 (415) 555-0123" {...field} />
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
                      placeholder="A brief description of the company"
                      className="resize-none"
                      {...field}
                    />
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
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., SaaS, Cloud, Enterprise" {...field} />
                  </FormControl>
                  <FormDescription>
                    Separate keywords with commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Submit"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
