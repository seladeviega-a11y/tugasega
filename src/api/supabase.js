import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials! Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🟢 Supabase Connected!');

// ============================================
// AUTH SERVICE
// ============================================
export const authService = {
  // ========== LOGIN ==========
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;

      if (!data?.user) throw new Error('User tidak ditemukan');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Profile error:', profileError);
      }

      return {
        user: {
          ...data.user,
          ...(profile || {
            name: data.user.email?.split('@')[0] || 'User',
            role: 'operator'
          })
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // ========== REGISTER (HANYA OPERATOR) ==========
  async register(email, password, name, employeeId, role = 'operator') {
    try {
      // 🔥 PAKSA ROLE OPERATOR (leader tidak bisa daftar sendiri)
      const finalRole = 'operator';
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            name, 
            role: finalRole, 
            employee_id: employeeId 
          }
        }
      });
      if (error) throw error;

      if (!data.user) throw new Error('Gagal registrasi');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: name,
          employee_id: employeeId,
          role: finalRole
        });

      if (profileError) throw profileError;

      return { 
        user: { 
          ...data.user, 
          name, 
          role: finalRole, 
          employee_id: employeeId 
        } 
      };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // ========== LOGOUT ==========
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // ========== GET CURRENT USER ==========
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      return {
        ...user,
        ...(profile || {
          name: user.email?.split('@')[0] || 'User',
          role: 'operator'
        })
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // ========== UPDATE PROFILE ==========
  async updateProfile(id, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // ========== GET ALL USERS ==========
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }
};

// ============================================
// PRODUCTION SERVICE
// ============================================
export const productionService = {
  // ========== STYLES ==========
  async getStyles() {
    try {
      const { data, error } = await supabase.from('styles').select('*').order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get styles error:', error);
      return [];
    }
  },

  // ========== LOTS ==========
  async getLots() {
    try {
      const { data, error } = await supabase
        .from('lots')
        .select('*, styles(name, target_per_hour)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get lots error:', error);
      return [];
    }
  },

  // ========== CREATE LOT ==========
  async createLot(lotData) {
    try {
      const { data, error } = await supabase.from('lots').insert(lotData).select().maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create lot error:', error);
      throw error;
    }
  },

  // ========== ASSIGNMENTS ==========
  async getAssignments(active = true) {
    try {
      let query = supabase
        .from('assignments')
        .select('*, profiles(name, employee_id), lots(style_id, lot_number, target_total)');
      if (active !== undefined) {
        query = query.eq('active', active);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get assignments error:', error);
      return [];
    }
  },

  // ========== CREATE ASSIGNMENT ==========
  async createAssignment(assignmentData) {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .insert(assignmentData)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create assignment error:', error);
      throw error;
    }
  },

  // ========== HOURLY OUTPUTS ==========
  async getHourlyOutputs(date) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('hourly_outputs')
        .select('*, profiles(name, employee_id), lots(style_id, lot_number)')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('jam', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching hourly outputs:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Get hourly outputs error:', error);
      return [];
    }
  },

  // ========== CREATE HOURLY OUTPUT ==========
  async createHourlyOutput(outputData) {
    try {
      const { data, error } = await supabase
        .from('hourly_outputs')
        .insert({
          operator_id: outputData.operator_id,
          lot_id: outputData.lot_id || null,
          jam: outputData.jam || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          qty: outputData.qty || 0,
          style: outputData.style || 'Unknown',
          remark: outputData.remark || '-'
        })
        .select()
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error creating hourly output:', error);
        throw error;
      }
      
      console.log('✅ Data tersimpan di Supabase:', data);
      return data;
    } catch (error) {
      console.error('Create hourly output error:', error);
      throw error;
    }
  },

  // ========== OPERATOR SUMMARY ==========
  async getOperatorSummary(operatorId, date) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('hourly_outputs')
        .select('qty')
        .eq('operator_id', operatorId)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      if (error) throw error;
      const total = data?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0;
      return { total, count: data?.length || 0 };
    } catch (error) {
      console.error('Get operator summary error:', error);
      return { total: 0, count: 0 };
    }
  },

  // ========== STYLE OUTPUTS ==========
  async getStyleOutputs(date) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('hourly_outputs')
        .select('style, qty')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      if (error) throw error;
      const styleMap = {};
      data?.forEach(item => {
        const style = item.style || 'Unknown';
        styleMap[style] = (styleMap[style] || 0) + (item.qty || 0);
      });
      return styleMap;
    } catch (error) {
      console.error('Get style outputs error:', error);
      return {};
    }
  },

  // ========== UPDATE STYLE TARGET ==========
  async updateStyleTarget(styleId, newTarget) {
    try {
      const { data, error } = await supabase
        .from('styles')
        .update({ target_per_hour: parseInt(newTarget) })
        .eq('id', styleId)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      console.log('✅ Target updated:', data);
      return data;
    } catch (error) {
      console.error('Update target error:', error);
      throw error;
    }
  },

  // ========== UPDATE LOT TARGET ==========
  async updateLotTarget(lotId, newTarget) {
    try {
      const { data, error } = await supabase
        .from('lots')
        .update({ target_total: parseInt(newTarget) })
        .eq('id', lotId)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      console.log('✅ Lot target updated:', data);
      return data;
    } catch (error) {
      console.error('Update lot target error:', error);
      throw error;
    }
  }
};

// ============================================
// CONSTRAINT SERVICE
// ============================================
export const constraintService = {
  // ========== GET CONSTRAINTS ==========
  async getConstraints(date) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('constraints')
        .select('*, profiles(name, employee_id), lots(style_id, lot_number)')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('jam', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get constraints error:', error);
      return [];
    }
  },

  // ========== CREATE CONSTRAINT ==========
  async createConstraint(constraintData) {
    try {
      const { data, error } = await supabase
        .from('constraints')
        .insert({
          operator_id: constraintData.operator_id,
          lot_id: constraintData.lot_id || null,
          jenis: constraintData.jenis,
          durasi: constraintData.durasi || 0,
          keterangan: constraintData.keterangan || '-',
          jam: constraintData.jam || new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          status: constraintData.status || 'Pending'
        })
        .select()
        .maybeSingle();
      
      if (error) {
        console.error('❌ Error creating constraint:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Create constraint error:', error);
      throw error;
    }
  },

  // ========== UPDATE CONSTRAINT STATUS ==========
  async updateConstraintStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('constraints')
        .update({ status })
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update constraint status error:', error);
      throw error;
    }
  },

  // ========== CONSTRAINT SUMMARY ==========
  async getConstraintSummary(date) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('constraints')
        .select('jenis, durasi')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);
      if (error) throw error;

      const summary = {
        total: data?.length || 0,
        totalDowntime: data?.reduce((sum, c) => sum + (c.durasi || 0), 0) || 0,
        byType: {}
      };
      data?.forEach(item => {
        const type = item.jenis || 'Lainnya';
        summary.byType[type] = (summary.byType[type] || 0) + 1;
      });
      return summary;
    } catch (error) {
      console.error('Get constraint summary error:', error);
      return { total: 0, totalDowntime: 0, byType: {} };
    }
  }
};

// ============================================
// REPORT SERVICE
// ============================================
export const reportService = {
  // ========== GENERATE DAILY REPORT ==========
  async generateDailyReport(date) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const lots = await productionService.getLots();
      const outputs = await productionService.getHourlyOutputs(today);
      const constraints = await constraintService.getConstraints(today);

      const lotReports = lots.map(lot => {
        const lotOutputs = outputs.filter(o => o.lot_id === lot.id);
        const totalActual = lotOutputs.reduce((sum, o) => sum + (o.qty || 0), 0);
        const lotConstraints = constraints.filter(c => c.lot_id === lot.id);

        return {
          lot_id: lot.id,
          style: lot.styles?.name || 'Unknown',
          lot_number: lot.lot_number,
          target: lot.target_total,
          actual: totalActual,
          achievement: lot.target_total > 0 ? (totalActual / lot.target_total * 100) : 0,
          constraints: lotConstraints.length,
          downtime: lotConstraints.reduce((sum, c) => sum + (c.durasi || 0), 0)
        };
      });

      const totalTarget = lotReports.reduce((sum, r) => sum + r.target, 0);
      const totalActual = lotReports.reduce((sum, r) => sum + r.actual, 0);

      return {
        date: today,
        totalTarget,
        totalActual,
        achievement: totalTarget > 0 ? (totalActual / totalTarget * 100) : 0,
        totalConstraints: constraints.length,
        totalDowntime: constraints.reduce((sum, c) => sum + (c.durasi || 0), 0),
        details: lotReports
      };
    } catch (error) {
      console.error('Generate daily report error:', error);
      return {
        date: date || new Date().toISOString().split('T')[0],
        totalTarget: 0,
        totalActual: 0,
        achievement: 0,
        totalConstraints: 0,
        totalDowntime: 0,
        details: []
      };
    }
  },

  // ========== OPERATOR PERFORMANCE ==========
  async getOperatorPerformance(date) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, employee_id')
        .eq('role', 'operator');

      const outputs = await productionService.getHourlyOutputs(today);
      const constraints = await constraintService.getConstraints(today);

      return profiles.map(profile => {
        const userOutputs = outputs.filter(o => o.operator_id === profile.id);
        const userConstraints = constraints.filter(c => c.operator_id === profile.id);
        const totalOutput = userOutputs.reduce((sum, o) => sum + (o.qty || 0), 0);
        const totalDowntime = userConstraints.reduce((sum, c) => sum + (c.durasi || 0), 0);

        return {
          ...profile,
          totalOutput,
          totalConstraints: userConstraints.length,
          totalDowntime
        };
      });
    } catch (error) {
      console.error('Get operator performance error:', error);
      return [];
    }
  },

  // ========== HOURLY SUMMARY ==========
  async getHourlySummary(date) {
    try {
      const today = date || new Date().toISOString().split('T')[0];
      const outputs = await productionService.getHourlyOutputs(today);
      const hourlyMap = {};
      outputs.forEach(item => {
        const hour = item.jam ? item.jam.split(':')[0] : '00';
        if (!hourlyMap[hour]) {
          hourlyMap[hour] = { hour, total: 0, count: 0 };
        }
        hourlyMap[hour].total += (item.qty || 0);
        hourlyMap[hour].count += 1;
      });
      return Object.values(hourlyMap).sort((a, b) => a.hour - b.hour);
    } catch (error) {
      console.error('Get hourly summary error:', error);
      return [];
    }
  },

  // ========== EXPORT PDF ==========
  async exportPDF(reportData) {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(20);
      doc.setTextColor('#0f2027');
      doc.text('Laporan Produksi Finishing Embroidery', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor('#718096');
      doc.text(`Tanggal: ${reportData.date}`, pageWidth / 2, 28, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor('#1a202c');
      doc.text(`Total Target: ${reportData.totalTarget} Pcs`, 20, 40);
      doc.text(`Total Aktual: ${reportData.totalActual} Pcs`, 20, 48);
      doc.text(`Pencapaian: ${reportData.achievement.toFixed(1)}%`, 20, 56);
      doc.text(`Total Kendala: ${reportData.totalConstraints}`, 20, 64);
      doc.text(`Total Downtime: ${reportData.totalDowntime} menit`, 20, 72);

      const tableData = reportData.details.map(item => [
        item.style,
        item.lot_number,
        item.target,
        item.actual,
        `${item.achievement.toFixed(1)}%`,
        item.constraints,
        `${item.downtime} mnt`
      ]);

      autoTable(doc, {
        startY: 80,
        head: [['Style', 'Lot', 'Target', 'Aktual', 'Pencapaian', 'Kendala', 'Downtime']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: '#0f2027', textColor: '#ffffff' }
      });

      const finalY = doc.lastAutoTable.finalY || 200;
      doc.setFontSize(10);
      doc.setTextColor('#a0aec0');
      doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 20, finalY + 20);
      doc.text('StitchControl AI © 2026', pageWidth / 2, finalY + 20, { align: 'center' });

      return doc;
    } catch (error) {
      console.error('Export PDF error:', error);
      throw error;
    }
  }
};