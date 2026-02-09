# Nabil Bank Production CSR Generation Guide

This guide helps you generate a Certificate Signing Request (CSR) file for Nabil Bank production environment.

## Bank Requirements

| Field | Description | Value |
|-------|-------------|-------|
| **CN** | Common Name (Domain) | Your production domain (e.g., `api.merosathi.co`) |
| **O** | Organization | Your legally registered business name |
| **OU** | Organization Unit | `600000001068090` (provided by bank) |
| **L** | Locality/City | City name (e.g., `Kathmandu`) - Do not abbreviate |
| **C** | Country | `NP` (Nepal - ISO 2-letter code) |
| **E** | Email | Email of responsible employee |

## Method 1: Using the Automated Script (Recommended)

### Step 1: Run the Script

```bash
cd backend
./scripts/generate-production-csr.sh
```

### Step 2: Enter Required Information

The script will prompt you for:
- **Common Name (CN)**: Your domain (e.g., `api.merosathi.co`)
- **Organization (O)**: Your company name (e.g., `MeroSathi`)
- **City/Locality (L)**: City name (e.g., `Kathmandu`)
- **Email (E)**: Contact email (e.g., `support@merosathi.co`)

The script uses defaults if you press Enter:
- CN: `api.merosathi.co`
- O: `MeroSathi`
- L: `Kathmandu`
- E: `support@merosathi.co`

### Step 3: Get CSR Content

The script will:
1. Generate a private key (`*.production.key`)
2. Generate a CSR file (`*.production.csr`)
3. Display the CSR content in the terminal

### Step 4: Send CSR to Bank

Copy the entire CSR content (between `-----BEGIN CERTIFICATE REQUEST-----` and `-----END CERTIFICATE REQUEST-----`) and send it to Nabil Bank.

---

## Method 2: Manual OpenSSL Command

If you prefer to generate the CSR manually:

### Step 1: Generate Private Key

```bash
openssl genrsa -out src/cert/api.merosathi.co.production.key 2048
```

### Step 2: Generate CSR

```bash
openssl req -new -key src/cert/api.merosathi.co.production.key -out src/cert/api.merosathi.co.production.csr
```

When prompted, enter:
```
Country Name (2 letter code) [XX]: NP
State or Province Name (full name) []: 
Locality Name (eg, city) []: Kathmandu
Organization Name (eg, company) []: MeroSathi
Organizational Unit Name (eg, section) []: 600000001068090
Common Name (eg, your name or your server's hostname) []: api.merosathi.co
Email Address []: support@merosathi.co
```

### Step 3: View CSR Content

```bash
cat src/cert/api.merosathi.co.production.csr
```

---

## Method 3: Using OpenSSL Config File

Create a config file `csr-config.conf`:

```ini
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
CN=api.merosathi.co
O=MeroSathi
OU=600000001068090
L=Kathmandu
C=NP
emailAddress=support@merosathi.co

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
```

Then generate:

```bash
# Generate private key
openssl genrsa -out src/cert/api.merosathi.co.production.key 2048

# Generate CSR
openssl req -new -key src/cert/api.merosathi.co.production.key -out src/cert/api.merosathi.co.production.csr -config csr-config.conf
```

---

## Verify CSR

Before sending to the bank, verify the CSR contains correct information:

```bash
openssl req -in src/cert/api.merosathi.co.production.csr -text -noout
```

Check that:
- ✅ **CN** matches your domain
- ✅ **O** matches your organization name
- ✅ **OU** is `600000001068090`
- ✅ **L** matches your city
- ✅ **C** is `NP`
- ✅ **Email** is correct

---

## After Receiving Certificate from Bank

Once Nabil Bank provides the signed certificate:

1. **Save the certificate file**:
   ```bash
   # Save as production certificate
   cp <bank-provided-certificate> src/cert/api.merosathi.co.production.crt
   ```

2. **Update your code** to use production certificate:
   - Update `nabil.service.ts` to use production cert paths
   - Or update environment variables in Vercel:
     - `NABIL_CERT_BASE64` (base64-encoded production cert)
     - `NABIL_KEY_BASE64` (base64-encoded production key)

3. **Encode for Vercel** (if using environment variables):
   ```bash
   base64 -i src/cert/api.merosathi.co.production.crt | tr -d '\n'
   base64 -i src/cert/api.merosathi.co.production.key | tr -d '\n'
   ```

4. **Update Vercel environment variables**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Update `NABIL_CERT_BASE64` with production certificate
   - Update `NABIL_KEY_BASE64` with production private key
   - Redeploy

---

## Security Notes

⚠️ **IMPORTANT:**
- **Never share your private key** (`*.key` file) with anyone, including the bank
- Only send the **CSR file** (`.csr`) to the bank
- Keep your private key secure and backed up
- The private key must match the certificate - if you lose it, you'll need to regenerate both

---

## Example CSR Output

The CSR will look like this:

```
-----BEGIN CERTIFICATE REQUEST-----
MIICvjCCAaYCAQAwfjELMAkGA1UEBhMCTlAxFTATBgNVBAgTDEthdGhtYW5kdTEV
MBMGA1UEBxMMS2F0aG1hbmR1MRMwEQYDVQQKEwpNZXJvU2F0aGkxGjAYBgNVBAsT
ETYwMDAwMDAwMDEwNjgwOTAxFTATBgNVBAMTDGFwaS5tZXJvc2F0aGkuY28wggEi
MA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC...
-----END CERTIFICATE REQUEST-----
```

Send this entire block (including the BEGIN and END lines) to Nabil Bank.

---

## Troubleshooting

### Error: "openssl: command not found"
Install OpenSSL:
- **macOS**: `brew install openssl`
- **Linux**: `sudo apt-get install openssl` or `sudo yum install openssl`
- **Windows**: Download from [OpenSSL website](https://www.openssl.org/)

### Error: "Permission denied"
Make the script executable:
```bash
chmod +x backend/scripts/generate-production-csr.sh
```

### CSR shows wrong information
- Delete the CSR file and regenerate
- Double-check all inputs before generating
- Use `openssl req -in <csr-file> -text -noout` to verify

---

## Contact

If you have issues generating the CSR, contact Nabil Bank support with:
- Your Merchant ID: `NABIL106809`
- OU: `600000001068090`
- The error message you're seeing
