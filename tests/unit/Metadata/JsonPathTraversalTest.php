<?php

namespace Tests\Unit\Metadata;

/**
 * Demonstrates usage of the metadata base class with custom JSON path walking.
 */
class JsonPathTraversalTest extends AbstractMetadataTest
{
	/**
	 * Example test using the walkJsonPath method directly.
	 */
	public function testWalkJsonPath(): void
	{
		$this->processMetadataFiles('entityDefs/*.json', function ($data, $file) {
			// Get entity name from file path
			$fileName = basename($file);
			$entityName = str_replace('.json', '', $fileName);

			// Process field definitions
			if (isset($data['fields'])) {
				// Count field types
				$fieldTypes = [];

				$fieldsProcessed = $this->walkJsonPath($data, ['fields', '*', 'type'], function ($fieldType, $context) use (&$fieldTypes) {
					if (!isset($fieldTypes[$fieldType])) {
						$fieldTypes[$fieldType] = 0;
					}
					$fieldTypes[$fieldType]++;
				}, [], false);

				$this->assertGreaterThanOrEqual(0, $fieldsProcessed, "No fields processed in $fileName");

				// We're not actually asserting anything about the counts, just demonstrating the method
				// In a real test, you might check that all types are valid from a known list, etc.
			}
		});
	}
}
