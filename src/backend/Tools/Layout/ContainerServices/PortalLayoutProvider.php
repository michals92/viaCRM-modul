<?php

namespace Espo\Modules\Viacrm\Tools\Layout\ContainerServices;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\File\Manager as FileManager;
use Espo\Core\Utils\Metadata;
use Espo\Core\Utils\Resource\FileReader;
use Espo\Modules\Viacrm\Tools\Layout\UnifiedLayoutProvider;

class PortalLayoutProvider extends \Espo\Tools\Layout\PortalLayoutProvider
{
	public function __construct(
		private readonly UnifiedLayoutProvider $unifiedLayoutProvider,
		FileManager $fileManager,
		InjectableFactory $injectableFactory,
		Metadata $metadata,
		FileReader $fileReader,
	) {
		parent::__construct($fileManager, $injectableFactory, $metadata, $fileReader);
	}

	/**
	 * @throws \JsonException
	 */
	public function get(string $scope, string $name): ?string
	{
		return $this->unifiedLayoutProvider
			->get($scope, $name) ?? parent::get($scope, $name);
	}
}
