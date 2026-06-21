/**
 * Supabase Database Connection & CRUD Operations
 */

const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE'; // TODO: Replace with actual URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE'; // TODO: Replace with actual Anon Key

// Initialize Supabase Client (Requires CDN script in index.html)
let supabaseClient;

if (typeof supabase !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
  // eslint-disable-next-line no-undef
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase is not configured yet. Please update SUPABASE_URL and SUPABASE_ANON_KEY in js/db.js.");
}

const DB = {
  isConfigured: function() {
    return supabaseClient !== undefined;
  },

  /**
   * Save a natal chart to the database
   */
  saveChart: async function(name, birthDate, birthTime, province, zodiac, ascendant) {
    if (!this.isConfigured()) return null;
    
    try {
      const { data, error } = await supabaseClient
        .from('saved_charts')
        .insert([
          { 
            name: name, 
            birth_date: birthDate, 
            birth_time: birthTime, 
            province: province,
            zodiac_sign: zodiac,
            ascendant_sign: ascendant,
            created_at: new Date().toISOString()
          }
        ])
        .select();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving chart to Supabase:', error);
      return null;
    }
  },

  /**
   * Fetch all saved charts from the database
   */
  getSavedCharts: async function() {
    if (!this.isConfigured()) return [];
    
    try {
      const { data, error } = await supabaseClient
        .from('saved_charts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching charts from Supabase:', error);
      return [];
    }
  },
  
  /**
   * Delete a saved chart
   */
  deleteChart: async function(id) {
    if (!this.isConfigured()) return false;
    
    try {
      const { error } = await supabaseClient
        .from('saved_charts')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chart:', error);
      return false;
    }
  }
};
