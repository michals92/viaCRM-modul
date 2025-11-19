<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Rebuild\RebuildAction;

/**
 * Tests for app/rebuild.json metadata
 */
class RebuildActionsTest extends AbstractMetadataTest {

	/**
	 * Test that all rebuild actions implement the RebuildAction interface
	 */
	public function testRebuildActionsImplementInterface(): void {
		$this->processMetadataFiles('app/rebuild.json', function ($data, $file) {
			$this->assertArrayHasKey(
				'actionClassNameList',
				$data,
				"'actionClassNameList' section is missing in rebuild.json"
			);
            
			$this->assertIsArray(
				$data['actionClassNameList'],
				"'actionClassNameList' must be an array in rebuild.json"
			);
            
			foreach ($data['actionClassNameList'] as $index => $actionClass) {
				// Skip __APPEND__ special value
				if ($actionClass === '__APPEND__') {
					continue;
				}
                
				$this->assertIsString(
					$actionClass,
					"Action class at index $index must be a string"
				);
                
				// Check if class exists
				$this->assertTrue(
					class_exists($actionClass),
					"Rebuild action class '$actionClass' does not exist"
				);
                
				// Check if the class implements the RebuildAction interface
				$reflection = new \ReflectionClass($actionClass);
				$this->assertTrue(
					$reflection->implementsInterface(RebuildAction::class),
					"Rebuild action class '$actionClass' must implement " . RebuildAction::class
				);
                
				// Check namespace pattern
				$this->assertMatchesRegularExpression(
					'/^Espo\\\\Modules\\\\Autocrm\\\\Core\\\\Rebuild\\\\Actions\\\\[A-Za-z0-9]+$/',
					$actionClass,
					"Rebuild action class '$actionClass' does not follow expected namespace pattern"
				);
			}
		});
	}
    
	/**
	 * Test that rebuild.json has the expected structure and contains __APPEND__
	 */
	public function testRebuildStructure(): void {
		$this->processMetadataFiles('app/rebuild.json', function ($data, $file) {
			$this->assertArrayHasKey(
				'actionClassNameList',
				$data,
				"'actionClassNameList' section is missing in rebuild.json"
			);
            
			$this->assertIsArray(
				$data['actionClassNameList'],
				"'actionClassNameList' must be an array in rebuild.json"
			);
            
			// Make sure there's at least one action defined
			$this->assertGreaterThan(
				0,
				count($data['actionClassNameList']),
				'There should be at least one action defined in actionClassNameList'
			);
            
			// Check that __APPEND__ is the first element if present
			if (in_array('__APPEND__', $data['actionClassNameList'])) {
				$this->assertSame(
					'__APPEND__',
					$data['actionClassNameList'][0],
					"If '__APPEND__' is used in actionClassNameList, it should be the first element"
				);
			}
            
			// Check for any non-string elements (excluding __APPEND__)
			foreach ($data['actionClassNameList'] as $index => $actionClass) {
				if ($actionClass === '__APPEND__') {
					continue;
				}
                
				$this->assertIsString(
					$actionClass,
					"Action class at index $index must be a string"
				);
			}
		});
	}

}