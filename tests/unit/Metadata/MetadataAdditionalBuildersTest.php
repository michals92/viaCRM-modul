<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Utils\Metadata\AdditionalBuilder;

/**
 * Tests for app/metadata.json additionalBuilderClassNameList entries
 */
class MetadataAdditionalBuildersTest extends AbstractMetadataTest {

	/**
	 * Test that all additional builders implement the AdditionalBuilder interface (directly or indirectly)
	 */
	public function testAdditionalBuildersImplementInterface(): void {
		$this->processMetadataFiles('app/metadata.json', function ($data, $file) {
			$this->assertArrayHasKey(
				'additionalBuilderClassNameList',
				$data,
				"'additionalBuilderClassNameList' section is missing in metadata.json"
			);
            
			$this->assertIsArray(
				$data['additionalBuilderClassNameList'],
				"'additionalBuilderClassNameList' must be an array"
			);
            
			foreach ($data['additionalBuilderClassNameList'] as $index => $builderClass) {
				// Skip the __APPEND__ special value
				if ($builderClass === '__APPEND__') {
					continue;
				}
                
				$this->assertIsString(
					$builderClass,
					"additionalBuilderClassNameList[$index] must be a string"
				);
                
				// Check class exists
				$this->assertTrue(
					class_exists($builderClass),
					"Builder class '$builderClass' does not exist"
				);
                
				// Check interface implementation - need to check class hierarchy
				$reflection = new \ReflectionClass($builderClass);
				$implementsBuilder = false;
                
				// Check if class implements the interface directly
				if ($reflection->implementsInterface(AdditionalBuilder::class)) {
					$implementsBuilder = true;
				} else {
					// Check if any parent class implements the interface
					$parentClass = $reflection->getParentClass();
					while ($parentClass !== false) {
						if ($parentClass->implementsInterface(AdditionalBuilder::class)) {
							$implementsBuilder = true;
							break;
						}
						$parentClass = $parentClass->getParentClass();
					}
				}
                
				$this->assertTrue(
					$implementsBuilder,
					"Builder class '$builderClass' must implement " . AdditionalBuilder::class . 
					' either directly or via inheritance'
				);
			}
		});
	}
    
	/**
	 * Test that metadata.json has the expected structure
	 */
	public function testMetadataStructure(): void {
		$this->processMetadataFiles('app/metadata.json', function ($data, $file) {
			// Check for required fields
			$this->assertArrayHasKey(
				'additionalBuilderClassNameList',
				$data,
				"'additionalBuilderClassNameList' section is missing in metadata.json"
			);
            
			$this->assertIsArray(
				$data['additionalBuilderClassNameList'],
				"'additionalBuilderClassNameList' must be an array"
			);
            
			// If __APPEND__ is present, it should be the first element
			if (count($data['additionalBuilderClassNameList']) > 0 &&
			    $data['additionalBuilderClassNameList'][0] === '__APPEND__') {
				// Check that subsequent elements are valid class strings
				foreach (array_slice($data['additionalBuilderClassNameList'], 1) as $index => $builderClass) {
					$this->assertIsString(
						$builderClass,
						'additionalBuilderClassNameList[' . ($index + 1) . '] must be a string'
					);
                    
					// Validate class name format (namespace pattern)
					$this->assertMatchesRegularExpression(
						'/^Espo\\\\Modules\\\\Autocrm\\\\Core\\\\Utils\\\\Metadata\\\\AdditionalBuilder\\\\[A-Za-z0-9]+$/',
						$builderClass,
						"Builder class '$builderClass' does not follow expected namespace pattern"
					);
				}
			}
		});
	}
    
	/**
	 * Test that all additional builders can be instantiated without parameters
	 */
	public function testAdditionalBuildersCanBeInstantiated(): void {
		$this->processMetadataFiles('app/metadata.json', function ($data, $file) {
			foreach ($data['additionalBuilderClassNameList'] as $builderClass) {
				// Skip the __APPEND__ special value
				if ($builderClass === '__APPEND__') {
					continue;
				}
                
				try {
					$reflection = new \ReflectionClass($builderClass);
					$constructor = $reflection->getConstructor();
                    
					// If constructor exists, it should have no required parameters
					if ($constructor !== null) {
						$requiredParams = array_filter(
							$constructor->getParameters(),
							fn($param) => !$param->isOptional()
						);
                        
						$this->assertCount(
							0,
							$requiredParams,
							"Builder class '$builderClass' constructor has required parameters, but shouldn't have any"
						);
					}
                    
					// Try to instantiate the builder
					$instance = new $builderClass();
					$this->assertInstanceOf(
						$builderClass,
						$instance,
						"Failed to instantiate builder class '$builderClass'"
					);
				} catch (\Exception $e) {
					$this->fail("Error instantiating builder class '$builderClass': " . $e->getMessage());
				}
			}
		});
	}

}