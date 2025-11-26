<?php

namespace Tests\Unit\Metadata;

use Espo\Tools\EmailTemplate\Placeholder;

/**
 * Tests for app/emailTemplate.json placeholders metadata.
 */
class EmailTemplatePlaceholdersTest extends AbstractMetadataTest
{
	/**
	 * Test that all placeholder classes implement the Placeholder interface.
	 */
	public function testPlaceholdersImplementInterface(): void
	{
		$this->assertJsonPathClassesImplementInterface(
			'app/emailTemplate.json',
			['placeholders', '*', 'className'],
			Placeholder::class,
			true, // Interface implementation is mandatory
			false // No __APPEND__ in this file
		);
	}

	/**
	 * Test the structure of emailTemplate.json placeholders section.
	 */
	public function testPlaceholdersStructure(): void
	{
		$this->processMetadataFiles('app/emailTemplate.json', function ($data, $file) {
			$this->assertArrayHasKey(
				'placeholders',
				$data,
				"'placeholders' section missing in emailTemplate.json"
			);

			$placeholders = $data['placeholders'];
			$this->assertIsArray(
				$placeholders,
				"'placeholders' must be an array in emailTemplate.json"
			);

			foreach ($placeholders as $name => $placeholder) {
				$this->assertIsArray(
					$placeholder,
					"Placeholder '$name' should be an array"
				);

				$this->assertArrayHasKey(
					'className',
					$placeholder,
					"Placeholder '$name' is missing required 'className' property"
				);

				$this->assertIsString(
					$placeholder['className'],
					"Placeholder '$name' className must be a string"
				);

				$this->assertTrue(
					class_exists($placeholder['className']),
					"Placeholder class '{$placeholder['className']}' does not exist"
				);

				// Check for order property (optional but recommended)
				if (array_key_exists('order', $placeholder)) {
					$this->assertIsNumeric(
						$placeholder['order'],
						"Placeholder '$name' order must be numeric"
					);
				}

				// Validate class name format (namespace pattern)
				$this->assertMatchesRegularExpression(
					'/^Espo\\\\Modules\\\\Viacrm\\\\Tools\\\\EmailTemplate\\\\Placeholders\\\\[A-Za-z0-9]+$/',
					$placeholder['className'],
					"Placeholder '$name' className does not follow expected namespace pattern"
				);
			}
		});
	}
}
