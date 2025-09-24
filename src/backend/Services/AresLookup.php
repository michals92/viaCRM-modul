<?php

namespace Espo\Modules\ViaCrm\Services;

use Espo\Core\Templates\Services\Base;

class AresLookup extends Base
{
    const ARES_REST_API_BASE = 'https://ares.gov.cz/ekonomicke-subjekty-v-be/rest';
    const ARES_XML_API_BASE = 'https://wwwinfo.mfcr.cz/cgi-bin/ares/darv_bas.cgi';
    
    public function searchByIco($ico)
    {
        if (empty($ico) || !is_numeric($ico)) {
            return null;
        }

        // Clean ICO (remove spaces, ensure 8 digits)
        $ico = str_pad(preg_replace('/[^0-9]/', '', $ico), 8, '0', STR_PAD_LEFT);
        
        try {
            // Try REST API first
            $data = $this->fetchFromRestApi($ico);
            if ($data) {
                return $data;
            }
            
            // Fallback to XML API
            $xmlData = $this->fetchFromXmlApi($ico);
            return $this->parseXmlResponse($xmlData);
            
        } catch (\Exception $e) {
            $GLOBALS['log']->error('ARES lookup failed for ICO ' . $ico . ': ' . $e->getMessage());
            return null;
        }
    }

    public function searchByName($name)
    {
        if (empty($name) || strlen($name) < 3) {
            return [];
        }

        try {
            return $this->searchByNameViaRestApi($name);
        } catch (\Exception $e) {
            $GLOBALS['log']->error('ARES name search failed: ' . $e->getMessage());
            return [];
        }
    }

    private function fetchFromRestApi($ico)
    {
        $url = self::ARES_REST_API_BASE . '/ekonomicke-subjekty/' . $ico;
        
        // Try cURL first if available
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'User-Agent: EspoCRM ARES Client'
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($response !== false && $httpCode === 200) {
                $data = json_decode($response, true);
                if (!empty($data) && !isset($data['kod'])) {
                    return $this->formatRestApiResponse($data);
                }
            }
        }
        
        // Fallback to file_get_contents
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'Accept: application/json',
                    'User-Agent: EspoCRM ARES Client'
                ],
                'timeout' => 10,
                'ignore_errors' => true
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            return null;
        }
        
        $data = json_decode($response, true);
        
        if (empty($data) || isset($data['kod'])) {
            // API returned error
            return null;
        }
        
        return $this->formatRestApiResponse($data);
    }
    
    private function searchByNameViaRestApi($name)
    {
        $url = self::ARES_REST_API_BASE . '/ekonomicke-subjekty/vyhledat';
        
        $searchData = [
            'obchodniJmeno' => $name,
            'pocetVysledku' => 10
        ];
        
        $jsonData = json_encode($searchData);
        
        // Try cURL first if available
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'Content-Type: application/json',
                'User-Agent: EspoCRM ARES Client',
                'Content-Length: ' . strlen($jsonData)
            ]);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($response !== false && $httpCode === 200) {
                $data = json_decode($response, true);
                if (!empty($data) && isset($data['ekonomickeSubjekty'])) {
                    $results = [];
                    foreach ($data['ekonomickeSubjekty'] as $subject) {
                        $results[] = $this->formatRestApiResponse($subject);
                    }
                    return $results;
                }
            }
        }
        
        // Fallback to file_get_contents
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => [
                    'Accept: application/json',
                    'Content-Type: application/json',
                    'User-Agent: EspoCRM ARES Client'
                ],
                'content' => $jsonData,
                'timeout' => 10,
                'ignore_errors' => true
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            return [];
        }
        
        $data = json_decode($response, true);
        
        if (empty($data) || !isset($data['ekonomickeSubjekty'])) {
            return [];
        }
        
        $results = [];
        foreach ($data['ekonomickeSubjekty'] as $subject) {
            $results[] = $this->formatRestApiResponse($subject);
        }
        
        return $results;
    }
    
    private function formatRestApiResponse($data)
    {
        $formatted = [
            'id' => $data['ico'] ?? '',
            'ico' => $data['ico'] ?? '',
            'name' => $data['obchodniJmeno'] ?? '',
            'dic' => $data['dic'] ?? '',
            'country' => 'CZ'
        ];
        
        // Extract address from sidlo
        if (isset($data['sidlo'])) {
            $sidlo = $data['sidlo'];
            
            $street = '';
            if (!empty($sidlo['nazevUlice'])) {
                $street = $sidlo['nazevUlice'];
                if (!empty($sidlo['cisloDomovni'])) {
                    $street .= ' ' . $sidlo['cisloDomovni'];
                }
                if (!empty($sidlo['cisloOrientacni'])) {
                    $street .= '/' . $sidlo['cisloOrientacni'];
                }
            } elseif (!empty($sidlo['nazevCastiObce']) && !empty($sidlo['cisloDomovni'])) {
                $street = $sidlo['nazevCastiObce'] . ' ' . $sidlo['cisloDomovni'];
            }
            
            $formatted['address'] = $street;
            $formatted['city'] = $sidlo['nazevObce'] ?? '';
            $formatted['zip'] = $sidlo['psc'] ?? '';
        }
        
        // Fallback to adresaDorucovaci if sidlo is not available
        if (empty($formatted['address']) && isset($data['adresaDorucovaci'])) {
            $addr = $data['adresaDorucovaci'];
            $formatted['address'] = trim(($addr['ulice'] ?? '') . ' ' . ($addr['cisloDomovni'] ?? ''));
            $formatted['city'] = $addr['obec'] ?? '';
            $formatted['zip'] = $addr['psc'] ?? '';
        }
        
        return $formatted;
    }

    private function fetchFromXmlApi($ico)
    {
        $url = self::ARES_XML_API_BASE . "?ico={$ico}&xml=1";
        
        // Try cURL first if available
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            curl_setopt($ch, CURLOPT_USERAGENT, 'EspoCRM ARES Client');
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
            
            $data = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($data !== false && $httpCode === 200) {
                return $data;
            }
        }
        
        // Fallback to file_get_contents
        $context = stream_context_create([
            'http' => [
                'timeout' => 10,
                'user_agent' => 'EspoCRM ARES Client'
            ]
        ]);
        
        $data = @file_get_contents($url, false, $context);
        
        if ($data === false) {
            throw new \Exception('Cannot fetch data from ARES XML API');
        }
        
        return $data;
    }

    private function parseXmlResponse($xmlData)
    {
        if (empty($xmlData)) {
            return null;
        }

        // Check for error in XML
        if (strpos($xmlData, '<Error>') !== false) {
            return null;
        }
        
        // Check if no records found
        if (strpos($xmlData, '<Pocet_zaznamu>0</Pocet_zaznamu>') !== false) {
            return null;
        }

        $result = [];

        // Extract ICO
        if (preg_match('/<ICO>(\d+)<\/ICO>/', $xmlData, $matches)) {
            $result['ico'] = $matches[1];
        }

        // Extract DIC
        if (preg_match('/<DIC>([^<]+)<\/DIC>/', $xmlData, $matches)) {
            $result['dic'] = $matches[1];
        }

        // Extract company name (OF = Obchodní firma)
        if (preg_match('/<OF>([^<]+)<\/OF>/', $xmlData, $matches)) {
            $result['name'] = html_entity_decode(trim($matches[1]), ENT_QUOTES, 'UTF-8');
        }

        // Extract address components
        $address = '';
        
        // Street name (NU)
        if (preg_match('/<NU>([^<]+)<\/NU>/', $xmlData, $matches)) {
            $address = html_entity_decode(trim($matches[1]), ENT_QUOTES, 'UTF-8');
        }
        
        // House number (CD or CO)
        if (preg_match('/<CD>([^<]+)<\/CD>/', $xmlData, $matches)) {
            $houseNumber = trim($matches[1]);
            if (!empty($address)) {
                $address .= ' ' . $houseNumber;
            } else {
                $address = $houseNumber;
            }
        }
        
        // Orientation number (CO)
        if (preg_match('/<CO>([^<]+)<\/CO>/', $xmlData, $matches)) {
            $address .= '/' . trim($matches[1]);
        }

        // City (N)
        if (preg_match('/<N>([^<]+)<\/N>/', $xmlData, $matches)) {
            $result['city'] = html_entity_decode(trim($matches[1]), ENT_QUOTES, 'UTF-8');
        }

        // ZIP code (PSC)
        if (preg_match('/<PSC>([^<]+)<\/PSC>/', $xmlData, $matches)) {
            $result['zip'] = str_replace(' ', '', trim($matches[1]));
        }

        $result['address'] = $address;
        $result['country'] = 'CZ';

        return !empty($result['ico']) ? [
            'id' => $result['ico'],
            'name' => $result['name'] ?? '',
            'ico' => $result['ico'],
            'dic' => $result['dic'] ?? '',
            'address' => $result['address'] ?? '',
            'city' => $result['city'] ?? '',
            'zip' => $result['zip'] ?? '',
            'country' => $result['country']
        ] : null;
    }
}