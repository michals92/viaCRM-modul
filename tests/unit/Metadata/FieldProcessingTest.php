<?php

namespace Tests\Unit\Metadata;

use Espo\Core\FieldProcessing\Loader as FieldLoader;
use Espo\Core\FieldProcessing\Saver;

/**
 * Tests for app/fieldProcessing.json metadata
 */
class FieldProcessingTest extends AbstractMetadataTest {

	/**
	 * Test that all read loaders implement the Loader interface
	 */
	public function testReadLoadersImplementInterface(): void {
		$this->assertJsonPathClassesImplementInterface(
			'app/fieldProcessing.json',
			['readLoaderClassNameList', '*'],
			FieldLoader::class,
			true, // Interface implementation is mandatory 
			true  // Allow __APPEND__ special value
		);
	}
    
	/**
	 * Test that all list loaders implement the Loader interface
	 */
	public function testListLoadersImplementInterface(): void {
		$this->assertJsonPathClassesImplementInterface(
			'app/fieldProcessing.json',
			['listLoaderClassNameList', '*'],
			FieldLoader::class,
			true, // Interface implementation is mandatory
			true  // Allow __APPEND__ special value
		);
	}
    
	/**
	 * Test that all savers implement the Saver interface
	 */
	public function testSaversImplementInterface(): void {
		$this->assertJsonPathClassesImplementInterface(
			'app/fieldProcessing.json',
			['saverClassNameList', '*'],
			Saver::class,
			true, // Interface implementation is mandatory
			true  // Allow __APPEND__ special value
		);
	}

	/**
	 * Test that fieldProcessing.json has the expected structure
	 */
	public function testFieldProcessingStructure(): void {
		$this->processMetadataFiles('app/fieldProcessing.json', function ($data, $file) {
			// Check required sections exist
			$this->assertArrayHasKey(
				'readLoaderClassNameList',
				$data,
				"'readLoaderClassNameList' section is missing in fieldProcessing.json"
			);
            
			$this->assertArrayHasKey(
				'listLoaderClassNameList',
				$data,
				"'listLoaderClassNameList' section is missing in fieldProcessing.json"
			);
            
			$this->assertArrayHasKey(
				'saverClassNameList',
				$data,
				"'saverClassNameList' section is missing in fieldProcessing.json"
			);
            
			// Check that each section is an array
			$this->assertIsArray(
				$data['readLoaderClassNameList'],
				"'readLoaderClassNameList' must be an array"
			);
            
			$this->assertIsArray(
				$data['listLoaderClassNameList'],
				"'listLoaderClassNameList' must be an array"
			);
            
			$this->assertIsArray(
				$data['saverClassNameList'],
				"'saverClassNameList' must be an array"
			);
            
			// Check for __APPEND__ and verify it's at the beginning
			foreach (['readLoaderClassNameList', 'listLoaderClassNameList', 'saverClassNameList'] as $section) {
				if (!empty($data[$section])) {
					// Check if the section contains __APPEND__
					$hasAppend = false;
					foreach ($data[$section] as $entry) {
						if ($entry === '__APPEND__') {
							$hasAppend = true;
							break;
						}
					}
                    
					if ($hasAppend) {
						// Verify __APPEND__ is the first element
						$this->assertSame(
							'__APPEND__',
							$data[$section][0],
							"If '__APPEND__' is used in '$section', it should be the first element"
						);
					}
                    
					// Check each class entry (skipping __APPEND__)
					foreach ($data[$section] as $entry) {
						if ($entry === '__APPEND__') {
							continue;
						}
                        
						$this->assertIsString(
							$entry,
							"Each entry in '$section' must be a string"
						);
                        
						$this->assertTrue(
							class_exists($entry),
							"Class '$entry' in '$section' does not exist"
						);
					}
				}
			}
		});
	}

}