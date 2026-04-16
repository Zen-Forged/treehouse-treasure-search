// Quick script to check vendor_requests table data
// Run with: node check-vendor-requests.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zogxkarpwlaqmamfzceb.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZ3hrYXJwd2xhcW1hbWZ6Y2ViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQyODE1OSwiZXhwIjoyMDkxMDA0MTU5fQ.JVWSvmtPGup6ufyhTpIXtdFowbzcp2LkL5F6hvu7czY';

const supabase = createClient(supabaseUrl, serviceKey);

async function checkVendorRequests() {
  console.log('🔍 Checking vendor_requests table...\n');
  
  try {
    // First check if table exists by trying to query it
    const { data, error, count } = await supabase
      .from('vendor_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error querying vendor_requests table:');
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Details:', error.details);
      
      if (error.code === '42P01') {
        console.log('\n💡 Table does not exist. Run this SQL in Supabase dashboard:');
        console.log(`
CREATE TABLE vendor_requests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  email        text NOT NULL,
  booth_number text,
  mall_id      uuid REFERENCES malls(id),
  mall_name    text,
  status       text DEFAULT 'pending',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE vendor_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON vendor_requests
  USING (false) WITH CHECK (false);
        `);
      }
      return;
    }

    console.log(`✅ vendor_requests table exists with ${count} total records\n`);
    
    if (data && data.length > 0) {
      console.log('📋 Recent vendor requests:');
      console.log('─'.repeat(80));
      
      data.forEach((request, index) => {
        console.log(`${index + 1}. ${request.name} (${request.email})`);
        console.log(`   Booth: ${request.booth_number || 'Not specified'}`);
        console.log(`   Mall: ${request.mall_name || 'Not specified'}`);
        console.log(`   Status: ${request.status}`);
        console.log(`   Created: ${new Date(request.created_at).toLocaleString()}`);
        console.log(`   ID: ${request.id}`);
        if (index < data.length - 1) console.log('');
      });
      
      // Count by status
      const pending = data.filter(r => r.status === 'pending').length;
      const approved = data.filter(r => r.status === 'approved').length;
      
      console.log('\n📊 Summary:');
      console.log(`   Pending: ${pending}`);
      console.log(`   Approved: ${approved}`);
      console.log(`   Total: ${count}`);
      
    } else {
      console.log('📭 No vendor requests found in the table');
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Run the check
checkVendorRequests().then(() => {
  console.log('\n✨ Check complete');
  process.exit(0);
});
