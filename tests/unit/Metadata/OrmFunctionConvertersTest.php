<?php

namespace Tests\Unit\Metadata;

use Espo\ORM\QueryComposer\Part\FunctionConverter;

/**
 * Tests for app/orm.json function converters
 */
class OrmFunctionConvertersTest extends AbstractMetadataTest {

	/**
	 * Test that all function converters implement the FunctionConverter interface
	 */
	public function testFunctionConvertersImplementInterface(): void {
		$this->processMetadataFiles('app/orm.json', function ($data, $file) {
			$this->assertArrayHasKey(
				'platforms',
				$data,
				"'platforms' section is missing in orm.json"
			);
            
			$this->assertIsArray(
				$data['platforms'],
				"'platforms' must be an array in orm.json"
			);
            
			foreach ($data['platforms'] as $platformName => $platformConfig) {
				$this->assertIsArray(
					$platformConfig,
					"Platform '$platformName' config must be an array"
				);
                
				$this->assertArrayHasKey(
					'functionConverterClassNameMap',
					$platformConfig,
					"Platform '$platformName' is missing 'functionConverterClassNameMap' property"
				);
                
				$this->assertIsArray(
					$platformConfig['functionConverterClassNameMap'],
					"Platform '$platformName' 'functionConverterClassNameMap' must be an array"
				);
                
				foreach ($platformConfig['functionConverterClassNameMap'] as $functionName => $converterClass) {
					$this->assertIsString(
						$converterClass,
						"Function converter for '$functionName' in platform '$platformName' must be a string"
					);
                    
					// Verify class exists
					$this->assertTrue(
						class_exists($converterClass),
						"Function converter class '$converterClass' for '$functionName' in platform '$platformName' does not exist"
					);
                    
					// Check interface implementation
					$reflection = new \ReflectionClass($converterClass);
					$this->assertTrue(
						$reflection->implementsInterface(FunctionConverter::class),
						"Function converter class '$converterClass' for '$functionName' in platform '$platformName' must implement " . 
						FunctionConverter::class
					);
                    
					// Check that the namespace follows the expected pattern
					$expectedNamespace = "Espo\\Modules\\Autocrm\\Core\\ORM\\QueryComposer\\Part\\FunctionConverters\\$platformName";
					$this->assertStringStartsWith(
						$expectedNamespace,
						$converterClass,
						"Function converter class '$converterClass' should be in the namespace '$expectedNamespace'"
					);
				}
			}
		});
	}
    
	/**
	 * Test that each platform has the same set of function converters
	 */
	public function testPlatformsHaveSameFunctions(): void {
		$this->processMetadataFiles('app/orm.json', function ($data, $file) {
			$this->assertArrayHasKey(
				'platforms',
				$data,
				"'platforms' section is missing in orm.json"
			);
            
			$this->assertIsArray(
				$data['platforms'],
				"'platforms' must be an array in orm.json"
			);
            
			$platformFunctions = [];
            
			// Collect function names for each platform
			foreach ($data['platforms'] as $platformName => $platformConfig) {
				$this->assertIsArray(
					$platformConfig,
					"Platform '$platformName' config must be an array"
				);
                
				$this->assertArrayHasKey(
					'functionConverterClassNameMap',
					$platformConfig,
					"Platform '$platformName' is missing 'functionConverterClassNameMap' property"
				);
                
				$platformFunctions[$platformName] = array_keys(
					$platformConfig['functionConverterClassNameMap']
				);
                
				// Sort for consistent comparison
				sort($platformFunctions[$platformName]);
			}
            
			// Make sure there are at least two platforms to compare
			$platformNames = array_keys($platformFunctions);
			$this->assertGreaterThanOrEqual(
				2, 
				count($platformNames),
				'There should be at least two database platforms defined in orm.json'
			);
            
			// Compare function sets between platforms
			$referencePlatform = $platformNames[0];
			$referenceFunctions = $platformFunctions[$referencePlatform];
            
			for ($i = 1; $i < count($platformNames); $i++) {
				$currentPlatform = $platformNames[$i];
				$currentFunctions = $platformFunctions[$currentPlatform];
                
				$this->assertEquals(
					$referenceFunctions,
					$currentFunctions,
					"Function sets for platforms '$referencePlatform' and '$currentPlatform' should be identical"
				);
			}
		});
	}

}