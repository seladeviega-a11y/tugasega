import { supabase } from '../supabase';

export const constraintService = {
  // Get constraints by date
  async getConstraints(date = new Date().toISOString().split('T')[0]) {
    const { data, error } = await supabase
      .from('constraints')
      .select('*, profiles(name, employee_id), lots(style_id, lot_number)')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)
      .order('jam', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create constraint
  async createConstraint(constraintData) {
    const { data, error } = await supabase
      .from('constraints')
      .insert({
        ...constraintData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update constraint status
  async updateConstraintStatus(id, status) {
    const { data, error } = await supabase
      .from('constraints')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get constraint summary
  async getConstraintSummary(date = new Date().toISOString().split('T')[0]) {
    const { data, error } = await supabase
      .from('constraints')
      .select('jenis, durasi')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);
    
    if (error) throw error;
    
    const summary = {
      total: data.length,
      totalDowntime: data.reduce((sum, item) => sum + (item.durasi || 0), 0),
      byType: {}
    };
    
    data.forEach(item => {
      const type = item.jenis || 'Lainnya';
      summary.byType[type] = (summary.byType[type] || 0) + 1;
    });
    
    return summary;
  }
};