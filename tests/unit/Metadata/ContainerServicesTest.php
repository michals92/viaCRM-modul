<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Container\Loader;

/**
 * Tests for app/containerServices.json metadata.
 */
class ContainerServicesTest extends AbstractMetadataTest
{
	/**
	 * Test that all container service class definitions exist.
	 */
	public function testContainerServicesClassesExist(): void
	{
		$this->assertJsonPathClassesExist(
			'app/containerServices.json',
			['*', 'className'],
			true, // Class existence is mandatory for all className entries
			false // No __APPEND__ in this file
		);
	}

	/**
	 * Test that all loaders implement the Loader interface.
	 */
	public function testContainerServicesLoadersImplementInterface(): void
	{
		$this->assertJsonPathClassesImplementInterface(
			'app/containerServices.json',
			['*', 'loaderClassName'],
			Loader::class,
			false, // Not mandatory since not all services have loaders
			false // No __APPEND__ in this file
		);
	}

	/**
	 * Test that container services have either a className or a loaderClassName.
	 */
	public function testContainerServicesHaveValidStructure(): void
	{
		$this->processMetadataFiles('app/containerServices.json', function ($data, $file) {
			foreach ($data as $key => $service) {
				$this->assertIsArray(
					$service,
					"Service '$key' should be an array"
				);

				$errorMessage = "Service '$key' must have either 'className' or 'loaderClassName' defined";
				$this->assertTrue(
					isset($service['className']) || isset($service['loaderClassName']),
					$errorMessage
				);

				if (isset($service['className'])) {
					$this->assertIsString(
						$service['className'],
						"Service '$key' className must be a string"
					);

					$this->assertTrue(
						class_exists($service['className']),
						"Service '$key' class '{$service['className']}' does not exist"
					);
				}

				if (isset($service['loaderClassName'])) {
					$this->assertIsString(
						$service['loaderClassName'],
						"Service '$key' loaderClassName must be a string"
					);

					$this->assertTrue(
						class_exists($service['loaderClassName']),
						"Service '$key' loader class '{$service['loaderClassName']}' does not exist"
					);

					$reflection = new \ReflectionClass($service['loaderClassName']);
					$this->assertTrue(
						$reflection->implementsInterface(Loader::class),
						"Service '$key' loader class '{$service['loaderClassName']}' must implement " . Loader::class
					);
				}
			}
		});
	}
}
