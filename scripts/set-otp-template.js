
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase Environment Variables');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function updateOtpTemplate() {
    console.log('🔄 Updating WhatsApp OTP Template to "otp_wb"...');

    // 1. Check current settings
    const { data: current, error: fetchError } = await supabase
        .from('site_settings')
        .select('*')
        .single();

    if (fetchError) {
        if (fetchError.code === 'PGRST116') {
            console.log('⚠️  No site_settings found. creating one...');
            const { error: insertError } = await supabase.from('site_settings').insert({
                whatsapp_otp_template: 'otp_wb'
            });
            if (insertError) {
                console.error('❌ Insert Error:', insertError);
            } else {
                console.log('✅ Settings created with template name.');
            }
            return;
        }
        console.error('❌ Fetch Error:', fetchError);
        return;
    }

    console.log('   Current Template:', current.whatsapp_otp_template || '(null)');

    // 2. Update
    const { data: updated, error: updateError } = await supabase
        .from('site_settings')
        .update({ whatsapp_otp_template: 'otp_wb' })
        .eq('id', current.id)
        .select();

    if (updateError) {
        console.error('❌ Update Error:', updateError);

        // Handle "Column not found" specifically if possible, though 'PGRST' codes vary
        if (updateError.message.includes('column "whatsapp_otp_template" of relation "site_settings" does not exist')) {
            console.error('🚨 The column `whatsapp_otp_template` does not exist in the database!');
            console.log('   You need to run a migration to add it.');
        }
    } else {
        console.log('✅ Update Successful!');
        console.log('   New Template:', updated[0].whatsapp_otp_template);
    }
}

updateOtpTemplate();
