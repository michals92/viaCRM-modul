<?php
// Test ARES API with real company data

// Test both REST and XML APIs
function testAresApis($ico) {
    echo "\n=== Testing ICO: $ico ===\n";
    
    // Test REST API
    echo "\n1. REST API Test:\n";
    $restUrl = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/' . $ico;
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Accept: application/json',
                'User-Agent: Test ARES Client'
            ],
            'timeout' => 10,
            'ignore_errors' => true
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    
    $response = @file_get_contents($restUrl, false, $context);
    
    if ($response !== false) {
        $data = json_decode($response, true);
        if (isset($data['ico'])) {
            echo "✓ Company found via REST API:\n";
            echo "  Name: " . ($data['obchodniJmeno'] ?? 'N/A') . "\n";
            echo "  ICO: " . ($data['ico'] ?? 'N/A') . "\n";
            echo "  DIC: " . ($data['dic'] ?? 'N/A') . "\n";
            if (isset($data['sidlo'])) {
                echo "  Address: " . ($data['sidlo']['nazevUlice'] ?? '') . " " . 
                     ($data['sidlo']['cisloDomovni'] ?? '') . ", " .
                     ($data['sidlo']['nazevObce'] ?? '') . " " .
                     ($data['sidlo']['psc'] ?? '') . "\n";
            }
        } else {
            echo "✗ Company not found or API error\n";
            if (isset($data['kod'])) {
                echo "  Error: " . ($data['popis'] ?? 'Unknown error') . "\n";
            }
        }
    } else {
        echo "✗ Failed to connect to REST API\n";
    }
    
    // Test XML API
    echo "\n2. XML API Test:\n";
    $xmlUrl = 'https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi?ico=' . $ico . '&xml=1';
    
    $xmlContext = stream_context_create([
        'http' => [
            'timeout' => 10,
            'user_agent' => 'Test ARES Client'
        ]
    ]);
    
    $xmlData = @file_get_contents($xmlUrl, false, $xmlContext);
    
    if ($xmlData !== false) {
        if (strpos($xmlData, '<Pocet_zaznamu>0</Pocet_zaznamu>') !== false) {
            echo "✗ Company not found in XML API\n";
        } elseif (preg_match('/<OF>([^<]+)<\/OF>/', $xmlData, $matches)) {
            echo "✓ Company found via XML API:\n";
            echo "  Name: " . html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8') . "\n";
            
            if (preg_match('/<ICO>(\d+)<\/ICO>/', $xmlData, $matches)) {
                echo "  ICO: " . $matches[1] . "\n";
            }
            if (preg_match('/<DIC>([^<]+)<\/DIC>/', $xmlData, $matches)) {
                echo "  DIC: " . $matches[1] . "\n";
            }
            
            $address = '';
            if (preg_match('/<NU>([^<]+)<\/NU>/', $xmlData, $matches)) {
                $address = html_entity_decode($matches[1], ENT_QUOTES, 'UTF-8');
            }
            if (preg_match('/<CD>([^<]+)<\/CD>/', $xmlData, $matches)) {
                $address .= ' ' . $matches[1];
            }
            if (preg_match('/<N>([^<]+)<\/N>/', $xmlData, $cityMatches) && 
                preg_match('/<PSC>([^<]+)<\/PSC>/', $xmlData, $zipMatches)) {
                $address .= ', ' . html_entity_decode($cityMatches[1], ENT_QUOTES, 'UTF-8') . 
                           ' ' . str_replace(' ', '', $zipMatches[1]);
            }
            if ($address) {
                echo "  Address: " . $address . "\n";
            }
        } else {
            echo "✗ Failed to parse XML response\n";
        }
    } else {
        echo "✗ Failed to connect to XML API\n";
    }
}

// Test name search
function testNameSearch($name) {
    echo "\n=== Testing name search: '$name' ===\n";
    
    $url = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/vyhledat';
    
    $searchData = [
        'obchodniJmeno' => $name,
        'pocetVysledku' => 5
    ];
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Accept: application/json',
                'Content-Type: application/json',
                'User-Agent: Test ARES Client'
            ],
            'content' => json_encode($searchData),
            'timeout' => 10,
            'ignore_errors' => true
        ],
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response !== false) {
        $data = json_decode($response, true);
        
        if (isset($data['ekonomickeSubjekty']) && count($data['ekonomickeSubjekty']) > 0) {
            echo "✓ Found " . count($data['ekonomickeSubjekty']) . " companies:\n";
            foreach ($data['ekonomickeSubjekty'] as $index => $company) {
                echo "\n  " . ($index + 1) . ". " . ($company['obchodniJmeno'] ?? 'N/A') . "\n";
                echo "     ICO: " . ($company['ico'] ?? 'N/A') . "\n";
                if (isset($company['sidlo'])) {
                    echo "     Location: " . ($company['sidlo']['nazevObce'] ?? 'N/A') . "\n";
                }
            }
        } else {
            echo "✗ No companies found\n";
        }
    } else {
        echo "✗ Failed to connect to search API\n";
    }
}

// Run tests with real Czech companies
echo "ARES API Real Data Test\n";
echo "========================\n";

// Test with known Czech companies
$testIcos = [
    '00006947' => 'České dráhy, a.s.',
    '27074358' => 'Alza.cz a.s.',
    '24821993' => 'Mall.cz s.r.o.',
    '45274649' => 'ČSOB',
    '00025224' => 'ČEZ, a.s.'
];

foreach ($testIcos as $ico => $expectedName) {
    echo "\nExpected: $expectedName\n";
    testAresApis($ico);
    sleep(1); // Be nice to the API
}

// Test name search
testNameSearch('Alza');
sleep(1);
testNameSearch('ČEZ');

echo "\n\n=== Test completed ===\n";