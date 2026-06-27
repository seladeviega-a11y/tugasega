import { supabase } from '../supabase';

export const productionService = {
  // Get all styles
  async getStyles() {
    const { data, error } = await supabase
      .from('styles')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Get all lots
  async getLots() {
    const { data, error } = await supabase
      .from('lots')
      .select('*, styles(name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Create lot
  async createLot(lotData) {
    const { data, error } = await supabase
      .from('lots')
      .insert(lotData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get assignments
  async getAssignments(active = true) {
    let query = supabase
      .from('assignments')
      .select('*, profiles(name, employee_id), lots(style_id, lot_number, target_total)');
    
    if (active !== undefined) {
      query = query.eq('active', active);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Create assignment
  async createAssignment(assignmentData) {
    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get hourly outputs
  async getHourlyOutputs(date = new Date().toISOString().split('T')[0]) {
    const { data, error } = await supabase
      .from('hourly_outputs')
      .select('*, profiles(name), lots(style_id, lot_number)')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`)
      .order('jam', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Create hourly output
  async createHourlyOutput(outputData) {
    const { data, error } = await supabase
      .from('hourly_outputs')
      .insert({
        ...outputData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get operator output summary
  async getOperatorSummary(operatorId, date = new Date().toISOString().split('T')[0]) {
    const { data, error } = await supabase
      .from('hourly_outputs')
      .select('qty')
      .eq('operator_id', operatorId)
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);
    
    if (error) throw error;
    
    const total = data.reduce((sum, item) => sum + (item.qty || 0), 0);
    return { total, count: data.length };
  },

  // Get total output per style
  async getStyleOutputs(date = new Date().toISOString().split('T')[0]) {
    const { data, error } = await supabase
      .from('hourly_outputs')
      .select('style, qty')
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);
    
    if (error) throw error;
    
    const styleMap = {};
    data.forEach(item => {
      const style = item.style || 'Unknown';
      styleMap[style] = (styleMap[style] || 0) + (item.qty || 0);
    });
    
    return styleMap;
  }
};