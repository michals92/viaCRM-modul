<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Duplicate\WhereBuilder;

/**
 * Tests for duplicateWhereBuilderClassName in recordDefs/*.json metadata
 */
class RecordDefsDuplicateWhereBuilderTest extends AbstractMetadataTest {

	/**
	 * Test that all duplicate where builders implement the WhereBuilder interface
	 */
	public function testDuplicateWhereBuilderImplementInterface(): void {
		$this->processMetadataFiles('recordDefs/*.json', function ($data, $file) {
			// Skip any recordDefs files that don't have duplicateWhereBuilderClassName
			if (!isset($data['duplicateWhereBuilderClassName'])) {
				return;
			}
            
			$fileName = basename($file);
			$entityType = str_replace('.json', '', $fileName);
            
			$builderClass = $data['duplicateWhereBuilderClassName'];
            
			$this->assertIsString(
				$builderClass,
				"duplicateWhereBuilderClassName in $entityType must be a string"
			);
            
			// Check if the builder class exists
			$this->assertTrue(
				class_exists($builderClass),
				"Duplicate where builder class '$builderClass' for $entityType does not exist"
			);
            
			// Check if the builder implements the WhereBuilder interface
			$reflection = new \ReflectionClass($builderClass);
			$this->assertTrue(
				$reflection->implementsInterface(WhereBuilder::class),
				"Duplicate where builder class '$builderClass' for $entityType must implement " . 
				WhereBuilder::class
			);
            
			// Check the method signature
			$this->assertTrue(
				$reflection->hasMethod('build'),
				"Duplicate where builder class '$builderClass' for $entityType must have a 'build' method"
			);
            
			$buildMethod = $reflection->getMethod('build');
			$this->assertTrue(
				$buildMethod->isPublic(),
				"build method in '$builderClass' for $entityType must be public"
			);
		});
	}
    
	/**
	 * Test that at least one entity defines a duplicate where builder
	 */
	public function testAtLeastOneDuplicateWhereBuilder(): void {
		$entityCount = 0;
        
		$this->processMetadataFiles('recordDefs/*.json', function ($data, $file) use (&$entityCount) {
			if (isset($data['duplicateWhereBuilderClassName'])) {
				$entityCount++;
                
				$fileName = basename($file);
				$entityType = str_replace('.json', '', $fileName);
                
				$this->assertIsString(
					$data['duplicateWhereBuilderClassName'],
					"duplicateWhereBuilderClassName in $entityType must be a string"
				);
			}
		});
        
		$this->assertGreaterThan(
			0,
			$entityCount,
			'There should be at least one entity with a duplicateWhereBuilderClassName defined'
		);
	}

}