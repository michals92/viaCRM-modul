<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Select\AccessControl\Filter;

/**
 * Tests for accessControlFilterClassNameMap in selectDefs/*.json metadata
 */
class SelectDefsAccessControlFiltersTest extends AbstractMetadataTest {

	/**
	 * Test that all access control filter implementations implement the Filter interface
	 */
	public function testAccessControlFiltersImplementInterface(): void {
		$this->processMetadataFiles('selectDefs/*.json', function ($data, $file) {
			// Skip any selectDefs files that don't have accessControlFilterClassNameMap
			if (!isset($data['accessControlFilterClassNameMap']) || !is_array($data['accessControlFilterClassNameMap'])) {
				return;
			}
            
			$fileName = basename($file);
			$entityType = str_replace('.json', '', $fileName);
            
			foreach ($data['accessControlFilterClassNameMap'] as $filterName => $filterClass) {
				$this->assertIsString(
					$filterClass,
					"Access control filter '$filterName' class in $entityType must be a string"
				);
                
				// Check if the filter class exists
				$this->assertTrue(
					class_exists($filterClass),
					"Access control filter class '$filterClass' for '$filterName' in $entityType does not exist"
				);
                
				// Check if the filter implements the Filter interface
				$reflection = new \ReflectionClass($filterClass);
				$this->assertTrue(
					$reflection->implementsInterface(Filter::class),
					"Access control filter class '$filterClass' for '$filterName' in $entityType must implement " . 
					Filter::class
				);
                
				// Check namespace pattern
				$expectedNamespacePattern = "^Espo\\\\Modules\\\\Viacrm\\\\Classes\\\\Select\\\\{$entityType}\\\\AccessControlFilters\\\\";
				$this->assertMatchesRegularExpression(
					"/{$expectedNamespacePattern}[A-Za-z0-9]+$/",
					$filterClass,
					"Access control filter class '$filterClass' for '$filterName' in $entityType does not follow " .
					'expected namespace pattern'
				);
			}
		});
	}
    
	/**
	 * Test that at least one entity defines access control filters
	 */
	public function testAtLeastOneAccessControlFilter(): void {
		$entityCount = 0;
        
		$this->processMetadataFiles('selectDefs/*.json', function ($data, $file) use (&$entityCount) {
			if (isset($data['accessControlFilterClassNameMap']) && is_array($data['accessControlFilterClassNameMap']) && count($data['accessControlFilterClassNameMap']) > 0) {
				$entityCount++;
                
				$fileName = basename($file);
				$entityType = str_replace('.json', '', $fileName);
                
				// Validate structure of all filters
				foreach ($data['accessControlFilterClassNameMap'] as $filterName => $filterClass) {
					$this->assertIsString(
						$filterName,
						"Access control filter name in $entityType must be a string"
					);
                    
					$this->assertIsString(
						$filterClass,
						"Access control filter class for '$filterName' in $entityType must be a string"
					);
				}
			}
		});
        
		$this->assertGreaterThan(
			0,
			$entityCount,
			'There should be at least one entity with accessControlFilterClassNameMap defined'
		);
	}

}