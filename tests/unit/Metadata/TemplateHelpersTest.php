<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Htmlizer\Helper;

/**
 * Tests for app/templateHelpers.json metadata
 */
class TemplateHelpersTest extends AbstractMetadataTest {

	/**
	 * Test that all template helpers implement the Helper interface
	 */
	public function testTemplateHelpersImplementInterface(): void {
		$this->processMetadataFiles('app/templateHelpers.json', function ($data, $file) {
			$this->assertIsArray(
				$data,
				'templateHelpers.json content should be an array'
			);
            
			// Make sure there's at least one helper defined
			$this->assertGreaterThan(
				0,
				count($data),
				'There should be at least one template helper defined'
			);
            
			// Check each template helper
			foreach ($data as $helperName => $helperClass) {
				$this->assertIsString(
					$helperClass,
					"Template helper '$helperName' class must be a string"
				);
                
				// Check if the helper class exists
				$this->assertTrue(
					class_exists($helperClass),
					"Template helper class '$helperClass' does not exist"
				);
                
				// Check if the helper implements the Helper interface
				$reflection = new \ReflectionClass($helperClass);
				$this->assertTrue(
					$reflection->implementsInterface(Helper::class),
					"Template helper class '$helperClass' must implement " . Helper::class
				);
                
				// Check namespace pattern
				$this->assertMatchesRegularExpression(
					'/^Espo\\\\Modules\\\\Viacrm\\\\Classes\\\\TemplateHelpers\\\\[A-Za-z0-9]+$/',
					$helperClass,
					"Template helper class '$helperClass' does not follow expected namespace pattern"
				);
			}
		});
	}

}