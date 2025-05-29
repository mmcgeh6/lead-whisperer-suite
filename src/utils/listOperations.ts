
import { supabase } from "@/integrations/supabase/client";

export const moveCompanyToList = async (companyId: string, oldListId: string | null, newListId: string) => {
  try {
    // First, remove the company from ALL lists to avoid duplicates
    const { error: deleteError } = await supabase
      .from('list_companies_new')
      .delete()
      .eq('company_id', companyId);

    if (deleteError) {
      console.error("Error removing from all lists:", deleteError);
      throw deleteError;
    }

    // Add to new list
    const { error: insertError } = await supabase
      .from('list_companies_new')
      .insert({
        company_id: companyId,
        list_id: newListId,
        added_at: new Date().toISOString()
      });

    if (insertError) {
      console.error("Error adding to new list:", insertError);
      throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error("Error moving company to list:", error);
    return { success: false, error };
  }
};

export const addCompanyToList = async (companyId: string, listId: string) => {
  try {
    // Check if company is already in this list
    const { data: existing } = await supabase
      .from('list_companies_new')
      .select('id')
      .eq('company_id', companyId)
      .eq('list_id', listId)
      .single();

    if (existing) {
      return { success: true, message: 'Company already in list' };
    }

    const { error } = await supabase
      .from('list_companies_new')
      .insert({
        company_id: companyId,
        list_id: listId,
        added_at: new Date().toISOString()
      });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error adding company to list:", error);
    return { success: false, error };
  }
};
