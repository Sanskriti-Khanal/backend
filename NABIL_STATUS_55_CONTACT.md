# Contact Nabil Bank - Status 55 Error

## Email Template for Nabil Bank Support

**To:** Swikar Shrestha <Swikar.Shrestha@nabilbank.com>, Transaction Banking <transaction.banking@nabilbank.com>

**Subject:** Status 55 Error - Production Merchant ID 600000001068090

**Body:**

Dear Nabil Bank Team,

We are experiencing Status 55 error when creating orders with the production API. All our configuration appears correct, and we would appreciate your assistance in resolving this issue.

**Merchant Details:**
- Merchant ID: 600000001068090
- API URL: https://adapter.nabilbank.com/Exec
- Domain: api.merosathi.co

**Request Being Sent:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request><Operation>CreateOrder</Operation>
<Language>EN</Language>
<Order>
<OrderType>Purchase</OrderType>
<Merchant>600000001068090</Merchant>
<Amount>100</Amount>
<Currency>524</Currency>
<Description>Test Payment NPR 1</Description>
<ApproveURL>https://api.merosathi.co/api/v1/payments/nabil/approve?transactionId=TXN_...</ApproveURL>
<CancelURL>https://api.merosathi.co/api/v1/payments/nabil/cancel?transactionId=TXN_...</CancelURL>
<DeclineURL>https://api.merosathi.co/api/v1/payments/nabil/decline?transactionId=TXN_...</DeclineURL>
<Fee>0</Fee>
</Order>
</Request>
</TKKPG>
```

**Response Received:**
```json
{
  "TKKPG": {
    "Response": {
      "Operation": "CreateOrder",
      "Status": "55"
    }
  }
}
```

**Configuration Verified:**
- ✅ Merchant ID: 600000001068090 (production)
- ✅ SSL Certificate: Valid and correctly configured
- ✅ API URL: https://adapter.nabilbank.com/Exec
- ✅ Callback URLs: All use HTTPS (https://api.merosathi.co)
- ✅ Amount: 100 paisa (for NPR 1.00)
- ✅ Currency: 524 (NPR)

**Questions:**
1. What does Status 55 specifically indicate?
2. Is the merchant ID 600000001068090 activated/enabled for production?
3. Do the callback URLs need to be whitelisted on your side?
4. Are there any additional requirements or validations we need to meet?
5. Is there a specific format or field requirement we might be missing?

**Additional Information:**
- SSL Certificate: Issued by Compass Plus Ltd (Processing Center Customers CA)
- Certificate Subject: api.merosathi.co
- Certificate Valid: Jan 12, 2026 - Jan 12, 2028

We have verified all our configuration and the request format matches the documentation. Any guidance on resolving Status 55 would be greatly appreciated.

Thank you for your assistance.

Best regards,
[Your Name]
[Your Contact Information]

---

## What Status 55 Likely Means

Based on common payment gateway error codes, Status 55 typically indicates:
- **Invalid merchant configuration** - Merchant ID not activated/enabled
- **Callback URL validation** - URLs not whitelisted or format issue
- **Merchant account status** - Account pending activation or restricted
- **Additional validation** - Missing required fields or format mismatch

---

## Next Steps

1. **Send the email above** to Nabil Bank support
2. **Wait for their response** - They may need to:
   - Activate/enable the merchant ID
   - Whitelist callback URLs
   - Provide additional configuration requirements
3. **Update configuration** based on their response
4. **Test again** after they make changes on their side

---

**Last Updated:** January 13, 2026
