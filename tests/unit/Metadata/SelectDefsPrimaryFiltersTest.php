<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Select\Primary\Filter;

/**
 * Tests for primaryFilterClassNameMap in selectDefs/*.json metadata
 */
class SelectDefsPrimaryFiltersTest extends AbstractMetadataTest {

	/**
	 * Test that all primary filter implementations implement the Filter interface
	 */
	public function testPrimaryFiltersImplementInterface(): void {
		$this->processMetadataFiles('selectDefs/*.json', function ($data, $file) {
			// Skip any selectDefs files that don't have primaryFilterClassNameMap
			if (!isset($data['primaryFilterClassNameMap']) || !is_array($data['primaryFilterClassNameMap'])) {
				return;
			}
            
			$fileName = basename($file);
			$entityType = str_replace('.json', '', $fileName);
            
			foreach ($data['primaryFilterClassNameMap'] as $filterName => $filterClass) {
				$this->assertIsString(
					$filterClass,
					"Primary filter '$filterName' class in $entityType must be a string"
				);
                
				// Check if the filter class exists
				$this->assertTrue(
					class_exists($filterClass),
					"Primary filter class '$filterClass' for '$filterName' in $entityType does not exist"
				);
                
				// Check if the filter implements the Filter interface
				$reflection = new \ReflectionClass($filterClass);
				$this->assertTrue(
					$reflection->implementsInterface(Filter::class),
					"Primary filter class '$filterClass' for '$filterName' in $entityType must implement " . 
					Filter::class
				);
                
				// Check namespace pattern
				$expectedNamespacePattern = "^Espo\\\\Modules\\\\Viacrm\\\\Classes\\\\Select\\\\{$entityType}\\\\PrimaryFilters\\\\";
				$this->assertMatchesRegularExpression(
					"/{$expectedNamespacePattern}[A-Za-z0-9]+$/",
					$filterClass,
					"Primary filter class '$filterClass' for '$filterName' in $entityType does not follow " .
					'expected namespace pattern'
				);
			}
		});
	}
    
	/**
	 * Test that at least one entity defines primary filters
	 */
	public function testAtLeastOnePrimaryFilter(): void {
		$entityCount = 0;
        
		$this->processMetadataFiles('selectDefs/*.json', function ($data, $file) use (&$entityCount) {
			if (isset($data['primaryFilterClassNameMap']) && is_array($data['primaryFilterClassNameMap']) && count($data['primaryFilterClassNameMap']) > 0) {
				$entityCount++;
                
				$fileName = basename($file);
				$entityType = str_replace('.json', '', $fileName);
                
				// Validate structure of all filters
				foreach ($data['primaryFilterClassNameMap'] as $filterName => $filterClass) {
					$this->assertIsString(
						$filterName,
						"Primary filter name in $entityType must be a string"
					);
                    
					$this->assertIsString(
						$filterClass,
						"Primary filter class for '$filterName' in $entityType must be a string"
					);
				}
			}
		});
        
		$this->assertGreaterThan(
			0,
			$entityCount,
			'There should be at least one entity with primaryFilterClassNameMap defined'
		);
	}

}