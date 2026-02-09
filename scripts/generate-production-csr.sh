#!/bin/bash

# Script to generate CSR (Certificate Signing Request) for Nabil Bank Production
# Usage: ./generate-production-csr.sh

echo "=========================================="
echo "Nabil Bank Production CSR Generator"
echo "=========================================="
echo ""
echo "This script will generate a CSR file for production with:"
echo "  OU: 600000001068090 (provided by bank)"
echo "  C: NP (Nepal)"
echo ""

# Default values (can be overridden)
DEFAULT_CN="api.merosathi.co"
DEFAULT_O="MeroSathi"
DEFAULT_L="Kathmandu"
DEFAULT_E="support@merosathi.co"

# Prompt for values or use defaults
read -p "Common Name (CN) [${DEFAULT_CN}]: " CN
CN=${CN:-$DEFAULT_CN}

read -p "Organization (O) [${DEFAULT_O}]: " O
O=${O:-$DEFAULT_O}

read -p "City/Locality (L) [${DEFAULT_L}]: " L
L=${L:-$DEFAULT_L}

read -p "Email (E) [${DEFAULT_E}]: " E
E=${E:-$DEFAULT_E}

# Fixed values as per bank requirements
OU="600000001068090"
C="NP"

echo ""
echo "=========================================="
echo "CSR Configuration:"
echo "=========================================="
echo "CN (Common Name):     $CN"
echo "O (Organization):     $O"
echo "OU (Org Unit):        $OU"
echo "L (Locality):         $L"
echo "C (Country):           $C"
echo "E (Email):            $E"
echo "=========================================="
echo ""

# Create cert directory if it doesn't exist
CERT_DIR="src/cert"
mkdir -p "$CERT_DIR"

# Generate filenames based on CN
SANITIZED_CN=$(echo "$CN" | sed 's/[^a-zA-Z0-9.-]/-/g')
PRIVATE_KEY_FILE="$CERT_DIR/${SANITIZED_CN}.production.key"
CSR_FILE="$CERT_DIR/${SANITIZED_CN}.production.csr"

# Check if files already exist
if [ -f "$PRIVATE_KEY_FILE" ]; then
    echo "⚠️  Warning: Private key file already exists: $PRIVATE_KEY_FILE"
    read -p "Do you want to overwrite it? (y/N): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "❌ Aborted. Please backup or rename the existing key file."
        exit 1
    fi
fi

if [ -f "$CSR_FILE" ]; then
    echo "⚠️  Warning: CSR file already exists: $CSR_FILE"
    read -p "Do you want to overwrite it? (y/N): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "❌ Aborted. Please backup or rename the existing CSR file."
        exit 1
    fi
fi

echo ""
echo "Generating private key and CSR..."
echo ""

# Generate private key (2048-bit RSA)
openssl genrsa -out "$PRIVATE_KEY_FILE" 2048

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to generate private key"
    exit 1
fi

echo "✅ Private key generated: $PRIVATE_KEY_FILE"

# Create OpenSSL config file for CSR
CONFIG_FILE=$(mktemp)
cat > "$CONFIG_FILE" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
CN=$CN
O=$O
OU=$OU
L=$L
C=$C
emailAddress=$E

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
EOF

# Generate CSR
openssl req -new -key "$PRIVATE_KEY_FILE" -out "$CSR_FILE" -config "$CONFIG_FILE"

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to generate CSR"
    rm -f "$CONFIG_FILE"
    exit 1
fi

# Clean up config file
rm -f "$CONFIG_FILE"

echo "✅ CSR generated: $CSR_FILE"
echo ""

# Display CSR content
echo "=========================================="
echo "CSR Content (send this to Nabil Bank):"
echo "=========================================="
echo ""
cat "$CSR_FILE"
echo ""
echo "=========================================="
echo ""

# Verify CSR
echo "Verifying CSR..."
openssl req -in "$CSR_FILE" -text -noout | grep -A 10 "Subject:"

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Copy the CSR content above"
echo "2. Send it to Nabil Bank team"
echo "3. Bank will provide you with the signed certificate (.crt file)"
echo "4. Once received, save it as: $CERT_DIR/${SANITIZED_CN}.production.crt"
echo "5. Update your code to use the production certificate"
echo ""
echo "Files generated:"
echo "  Private Key: $PRIVATE_KEY_FILE"
echo "  CSR:         $CSR_FILE"
echo ""
echo "⚠️  IMPORTANT: Keep the private key file secure and never share it!"
echo "=========================================="
