// Checkout page JavaScript - external file to avoid CSP issues
document.getElementById('checkoutForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const button = document.getElementById('payButton');
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('errorMessage');
    
    button.disabled = true;
    button.textContent = 'Processing...';
    loading.classList.add('active');
    errorMessage.classList.remove('show');
    
    try {
        // Get API base URL from body data attribute (injected by server)
        const body = document.body;
        let apiBaseUrl = body.getAttribute('data-api-base-url');
        
        // Fallback if data attribute not set or contains placeholder
        if (!apiBaseUrl || apiBaseUrl.includes('{{')) {
            apiBaseUrl = window.location.origin; // Use current origin as fallback
        }
        
        const checkoutUrl = `${apiBaseUrl}/api/v1/payments/nabil/checkout`;
        
        console.log('========================================');
        console.log('NABIL EPG CHECKOUT - INITIATING');
        console.log('========================================');
        console.log('API URL:', checkoutUrl);
        console.log('========================================');
        
        const response = await fetch(checkoutUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log('Response status:', response.status);
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text);
            throw new Error('Server returned non-JSON response. Status: ' + response.status);
        }
        
        console.log('Response data:', JSON.stringify(data, null, 2));
        
        if (!response.ok) {
            const errorMsg = data.error?.message || data.message || `Payment processing failed (Status: ${response.status})`;
            console.error('API Error:', errorMsg);
            throw new Error(errorMsg);
        }
        
        if (data.success && data.data?.paymentUrl) {
            const paymentUrl = data.data.paymentUrl;
            console.log('✅ Payment URL received:', paymentUrl);
            console.log('🔄 Redirecting to Nabil Bank payment page...');
            
            // Validate URL
            if (!paymentUrl || paymentUrl.trim() === '') {
                throw new Error('Payment URL is empty');
            }
            
            if (!paymentUrl.startsWith('http://') && !paymentUrl.startsWith('https://')) {
                throw new Error('Invalid payment URL format: ' + paymentUrl);
            }
            
            // Decode URL-encoded parameters if needed
            const decodedUrl = decodeURIComponent(paymentUrl);
            console.log('🔗 Decoded payment URL:', decodedUrl);
            
            // Redirect to bank's payment page immediately
            // Use window.location.replace to prevent back button issues
            window.location.replace(decodedUrl);
        } else {
            console.error('❌ Invalid response structure:', data);
            throw new Error('No payment URL received. Response: ' + JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Checkout error:', error);
        
        let errorText = error.message || 'An error occurred. Please try again.';
        if (error.message && error.message.includes('Failed to fetch')) {
            errorText = 'Network error: Could not connect to server. Please check your internet connection.';
        }
        
        errorMessage.textContent = errorText;
        errorMessage.classList.add('show');
        button.disabled = false;
        button.textContent = document.getElementById('payButton').getAttribute('data-button-label') || 'Pay';
        loading.classList.remove('active');
    }
});

