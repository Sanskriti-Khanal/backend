<?php
// Nabil Bank EPG Test Script
// Usage: php testnow_new.php

$url = "https://api.compassplus.com:11611/Exec"; // TEST environment
//$url = "https://adapter.nabilbank.com/Exec"; // LIVE environment

// SSL Certificate paths - Use relative paths (same directory as this script)
$cert_file = __DIR__ . '/merosathi.co.crt';
$key_file = __DIR__ . '/merosathi.key';

// Check if certificate files exist
if (!file_exists($cert_file)) {
    echo "❌ Error: Certificate file not found: $cert_file\n";
    exit(1);
}

if (!file_exists($key_file)) {
    echo "❌ Error: Key file not found: $key_file\n";
    exit(1);
}

// Get base URL from environment or use default
$baseUrl = getenv('BASE_URL') ?: $_ENV['BASE_URL'] ?? "https://api.merosathi.co";

// Build callback URLs
$approveURL = $baseUrl . "/api/v1/payments/nabil/approve";
$cancelURL = $baseUrl . "/api/v1/payments/nabil/cancel";
$declineURL = $baseUrl . "/api/v1/payments/nabil/decline";

// Generate unique description
$description = "TEST_" . date('YmdHis') . "_" . rand(1000, 9999);

// Build XML request (matching exact format from Nabil Bank documentation)
$xml = '<?xml version="1.0" encoding="UTF-8"?>
<TKKPG>
<Request><Operation>CreateOrder</Operation>
<Language>EN</Language>
<Order>
<OrderType>Purchase</OrderType>
<Merchant>NABIL106809</Merchant>
<Amount>100</Amount>
<Currency>524</Currency>
<Description>' . htmlspecialchars($description, ENT_XML1, 'UTF-8') . '</Description>
<ApproveURL>' . htmlspecialchars($approveURL, ENT_XML1, 'UTF-8') . '</ApproveURL>
<CancelURL>' . htmlspecialchars($cancelURL, ENT_XML1, 'UTF-8') . '</CancelURL>
<DeclineURL>' . htmlspecialchars($declineURL, ENT_XML1, 'UTF-8') . '</DeclineURL>
<Fee>0</Fee>
</Order>
</Request>
</TKKPG>';

$headers = array(
    "Content-type: text/xml",
    "Content-length: " . strlen($xml),
    "Connection: close",
);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL,$url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $xml);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_SSLCERT, $cert_file);
curl_setopt($ch, CURLOPT_SSLKEY, $key_file);

$data = curl_exec($ch);

if(!$data)
{
	echo "❌ Curl Error : " . curl_error($ch) . "\n";
	exit(1);
}

if(curl_errno($ch))
{
	echo "❌ cURL Error: " . curl_error($ch) . "\n";
	exit(1);
}

// Output raw XML response
echo $data;

?>
