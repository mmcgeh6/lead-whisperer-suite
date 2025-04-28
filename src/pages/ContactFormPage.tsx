
import { useParams } from "react-router-dom";
import { useAppContext } from "@/context/AppContext";
import { Layout } from "@/components/Layout";
import { ContactForm } from "@/components/leads/ContactForm";

const ContactFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const { contacts } = useAppContext();
  
  const contact = id ? contacts.find((c) => c.id === id) : undefined;
  const isEditing = !!contact;
  
  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Contact" : "Add New Contact"}
        </h1>
        
        <ContactForm initialData={contact} />
      </div>
    </Layout>
  );
};

export default ContactFormPage;
