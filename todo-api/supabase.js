const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkConnection() {
  const { error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
}

module.exports = { supabase, checkConnection };
