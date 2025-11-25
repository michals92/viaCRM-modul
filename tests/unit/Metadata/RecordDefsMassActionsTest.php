<?php

namespace Tests\Unit\Metadata;

use Espo\Core\MassAction\MassAction;

/**
 * Tests for massActions in recordDefs/*.json metadata
 */
class RecordDefsMassActionsTest extends AbstractMetadataTest {

	/**
	 * Test that all mass action implementations implement the MassAction interface
	 */
	public function testMassActionsImplementInterface(): void {
		$this->processMetadataFiles('recordDefs/*.json', function ($data, $file) {
			// Skip any recordDefs files that don't have massActions
			if (!isset($data['massActions']) || !is_array($data['massActions'])) {
				return;
			}
            
			$fileName = basename($file);
			$entityType = str_replace('.json', '', $fileName);
            
			foreach ($data['massActions'] as $actionName => $actionConfig) {
				$this->assertIsArray(
					$actionConfig,
					"Mass action '$actionName' config in $entityType must be an array"
				);
                
				// implementationClassName is optional - only test it if it's present
				if (isset($actionConfig['implementationClassName'])) {
					$implementationClass = $actionConfig['implementationClassName'];
                    
					$this->assertIsString(
						$implementationClass,
						"implementationClassName for mass action '$actionName' in $entityType must be a string"
					);
                    
					// Check if the implementation class exists
					$this->assertTrue(
						class_exists($implementationClass),
						"Mass action implementation class '$implementationClass' for '$actionName' in $entityType does not exist"
					);
                    
					// Check if the implementation implements the MassAction interface
					$reflection = new \ReflectionClass($implementationClass);
					$this->assertTrue(
						$reflection->implementsInterface(MassAction::class),
						"Mass action implementation class '$implementationClass' for '$actionName' in $entityType must implement " . 
						MassAction::class
					);
                    
					// Check namespace pattern
					$expectedNamespacePattern = "^Espo\\\\Modules\\\\Viacrm\\\\Classes\\\\MassAction\\\\{$entityType}\\\\";
					$this->assertMatchesRegularExpression(
						"/{$expectedNamespacePattern}[A-Za-z0-9]+$/",
						$implementationClass,
						"Mass action implementation class '$implementationClass' for '$actionName' in $entityType does not follow " .
						'expected namespace pattern'
					);
				}
			}
		});
	}
    
	/**
	 * Test that recordDefs files with massActions have the expected structure
	 */
	public function testMassActionsStructure(): void {
		$massActionEntities = [];
        
		$this->processMetadataFiles('recordDefs/*.json', function ($data, $file) use (&$massActionEntities) {
			if (isset($data['massActions']) && is_array($data['massActions']) && !empty($data['massActions'])) {
				$fileName = basename($file);
				$entityType = str_replace('.json', '', $fileName);
				$massActionEntities[] = $entityType;
                
				foreach ($data['massActions'] as $actionName => $actionConfig) {
					$this->assertIsArray(
						$actionConfig,
						"Mass action '$actionName' config in $entityType must be an array"
					);
                    
					// implementationClassName is optional - only test it if it's present
					if (isset($actionConfig['implementationClassName'])) {
						$this->assertIsString(
							$actionConfig['implementationClassName'],
							"implementationClassName for mass action '$actionName' in $entityType must be a string"
						);
					}
				}
			}
		});
        
		// Make sure at least one entity has mass actions defined
		$this->assertGreaterThan(
			0,
			count($massActionEntities),
			'There should be at least one entity with mass actions defined'
		);
	}

}