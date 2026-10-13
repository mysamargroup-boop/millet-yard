
async function testLogin() {
    const url = 'https://api.nemaone.com/api/auth/otp/request';
    const phone = '919691045405';

    console.log(`Testing Login API at ${url} for phone ${phone}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });

        console.log('Response Status:', response.status);
        const data = await response.json();
        console.log('Response Body:', JSON.stringify(data, null, 2));

        if (data.otp === '339633') {
            console.log('✅ SUCCESS: Fixed OTP 339633 received.');
        } else {
            console.log('❌ FAILURE: Incorrect OTP or logic.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testLogin();
