#!/bin/bash

# Script to encode Nabil Bank SSL certificates for Vercel environment variables
# Usage: 
#   ./encode-certificates.sh          # Encode test certificates
#   ./encode-certificates.sh production  # Encode production certificates

CERT_DIR="src/cert"

# Determine which certificates to encode
if [ "$1" == "production" ]; then
    CERT_FILE="$CERT_DIR/api.merosathi.co.production.crt"
    KEY_FILE="$CERT_DIR/api.merosathi.co.production.key"
    ENV_TYPE="PRODUCTION"
else
    CERT_FILE="$CERT_DIR/merosathi.co.crt"
    KEY_FILE="$CERT_DIR/merosathi.key"
    ENV_TYPE="TEST"
fi

echo "=========================================="
echo "Nabil Bank Certificate Encoder"
echo "Environment: $ENV_TYPE"
echo "=========================================="
echo ""

# Check if certificate files exist
if [ ! -f "$CERT_FILE" ]; then
    echo "❌ Error: Certificate file not found at $CERT_FILE"
    exit 1
fi

if [ ! -f "$KEY_FILE" ]; then
    echo "❌ Error: Key file not found at $KEY_FILE"
    exit 1
fi

echo "✅ Found certificate files:"
echo "   Certificate: $CERT_FILE"
echo "   Key: $KEY_FILE"
echo ""

# Encode to base64
echo "Encoding certificates to base64..."
CERT_BASE64=$(base64 -i "$CERT_FILE" | tr -d '\n')
KEY_BASE64=$(base64 -i "$KEY_FILE" | tr -d '\n')

echo ""
echo "=========================================="
echo "Add these to Vercel Environment Variables:"
echo "=========================================="
echo ""
echo "Variable Name: NABIL_CERT_BASE64"
echo "Value:"
echo "$CERT_BASE64"
echo ""
echo "Variable Name: NABIL_KEY_BASE64"
echo "Value:"
echo "$KEY_BASE64"
echo ""
echo "=========================================="
echo "Instructions:"
echo "=========================================="
echo "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "2. Add NABIL_CERT_BASE64 with the certificate value above"
echo "3. Add NABIL_KEY_BASE64 with the key value above"
if [ "$ENV_TYPE" == "PRODUCTION" ]; then
    echo "4. ⚠️  IMPORTANT: Set them for 'Production' environment ONLY"
    echo "5. Do NOT set them for Preview/Development (keep test values)"
else
    echo "4. Set them for the appropriate environment (Test/Development)"
fi
echo "5. Redeploy your application"
echo "=========================================="





