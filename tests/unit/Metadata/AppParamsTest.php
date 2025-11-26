<?php

namespace Tests\Unit\Metadata;

use Espo\Tools\App\AppParam;

/**
 * Tests for app/appParams.json metadata.
 */
class AppParamsTest extends AbstractMetadataTest
{
	/**
	 * Test that all classes defined in appParams.json implement the AppParam interface.
	 */
	public function testAppParamsImplementInterface(): void
	{
		$this->assertJsonPathClassesImplementInterface(
			'app/appParams.json',
			['*', 'className'],
			AppParam::class,
			true, // Interface implementation is mandatory
			false // No __APPEND__ in this file
		);
	}

	/**
	 * Test that appParams.json entries follow standard structure.
	 */
	public function testAppParamsStructure(): void
	{
		$this->processMetadataFiles('app/appParams.json', function ($data, $file) {
			foreach ($data as $key => $appParam) {
				$this->assertIsArray(
					$appParam,
					"App param '$key' should be an array"
				);

				$this->assertArrayHasKey(
					'className',
					$appParam,
					"App param '$key' is missing required 'className' property"
				);

				$this->assertIsString(
					$appParam['className'],
					"App param '$key' className must be a string"
				);

				// Validate class name format (namespace pattern)
				$this->assertMatchesRegularExpression(
					'/^Espo\\\\Modules\\\\Viacrm\\\\Classes\\\\AppParams\\\\[A-Za-z0-9]+$/',
					$appParam['className'],
					"App param '$key' className does not follow expected namespace pattern"
				);
			}
		});
	}
}
