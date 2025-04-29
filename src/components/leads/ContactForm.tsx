
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Contact } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string(),
  title: z.string(),
  companyId: z.string().min(1, "Company is required"),
  notes: z.string(),
  linkedin_url: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  initialData?: Contact;
}

export const ContactForm = ({ initialData }: ContactFormProps) => {
  const { addContact, updateContact, companies } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Get companyId from URL parameters if provided
  const companyIdFromUrl = searchParams.get("companyId");
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData ? {
      firstName: initialData.firstName,
      lastName: initialData.lastName,
      email: initialData.email,
      phone: initialData.phone,
      title: initialData.title,
      companyId: initialData.companyId,
      notes: initialData.notes,
      linkedin_url: initialData.linkedin_url || '',
    } : {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      companyId: companyIdFromUrl || "",
      notes: "",
      linkedin_url: "",
    },
  });
  
  // Update form if companyId URL parameter changes
  useEffect(() => {
    if (companyIdFromUrl && !initialData) {
      form.setValue("companyId", companyIdFromUrl);
    }
  }, [companyIdFromUrl, form, initialData]);
  
  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (initialData) {
        // Update contact in Supabase
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            phone: values.phone,
            position: values.title,
            company_id: values.companyId,
            notes: values.notes,
            linkedin_url: values.linkedin_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData.id);
        
        if (error) throw error;
        
        // Update in local state
        updateContact({
          ...initialData,
          ...values,
          updatedAt: new Date().toISOString()
        });
        
        toast({
          title: "Contact Updated",
          description: `${values.firstName} ${values.lastName} has been updated.`
        });
      } else {
        // Insert new contact into Supabase
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            phone: values.phone,
            position: values.title,
            company_id: values.companyId,
            notes: values.notes,
            linkedin_url: values.linkedin_url
          })
          .select();
        
        if (error) throw error;
        
        if (data && data[0]) {
          // Add to local state
          const newContact: Contact = {
            id: data[0].id,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone || "",
            title: values.title || "",
            companyId: values.companyId,
            notes: values.notes || "",
            linkedin_url: values.linkedin_url,
            createdAt: data[0].created_at,
            updatedAt: data[0].updated_at
          };
          
          addContact(newContact);
          
          toast({
            title: "Contact Added",
            description: `${values.firstName} ${values.lastName} has been added.`
          });
        }
      }
      
      // Redirect back to company detail or leads page
      navigate(companyIdFromUrl ? `/leads/${companyIdFromUrl}` : "/leads");
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Failed to save contact",
        description: "There was an error saving your contact. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Contact" : "Add New Contact"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.smith@example.com" {...field} />
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
                      <Input placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="CEO, Marketing Director, etc." {...field} />
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
                      <Input placeholder="https://www.linkedin.com/in/johnsmith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Company</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional information, conversation notes, etc."
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
                onClick={() => navigate(companyIdFromUrl ? `/leads/${companyIdFromUrl}` : "/leads")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : initialData ? "Update Contact" : "Add Contact"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
