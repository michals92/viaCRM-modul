<?php

namespace Espo\Modules\Autocrm\Tools\Layout;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\File\Manager as FileManager;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Metadata;
use Espo\Core\Utils\Resource\Reader as ResourceReader;
use Espo\Core\Utils\Resource\Reader\Params as ResourceReaderParams;
use Espo\Core\Utils\Util;
use Espo\Modules\Autocrm\Core\Utils\LayoutProvider\AdditionalBuilder;

class UnifiedLayoutProvider {

	private string $defaultPath = 'application/Espo/Modules/Autocrm/Resources/defaults/layouts';

	/** @var array<string, mixed> $data */
	private array $data;

	public function __construct(
		private readonly FileManager       $fileManager,
		private readonly ResourceReader    $resourceReader,
		private readonly Metadata          $metadata,
		private readonly InjectableFactory $injectableFactory
	) {
		$this->data = $this->resourceReader->readAsArray(
			'layouts',
			ResourceReaderParams::create()
		);
	}

	/**
	 * @throws \JsonException
	 */
	public function get(
		string $scope,
		string $name
	): ?string {
		// 1. Unified layout
		$layout = Util::getValueByKey($this->data, [$scope, $name]);

		if ($layout === null) {
			$path = "$this->defaultPath/$name.json";

			// 2. AutoCRM's default layout
			if ($this->fileManager->isFile($path)) {
				$layout = (array)JSON::decode($this->fileManager->getContents($path));
			}
		}

		if ($layout === null) {
			return null;
		}

		if (empty($layout)) {
			return JSON::encode([]);
		}

		if (!is_array($layout)) {
			$layout = (array)$layout;
		}

		$layoutBuilder = $this->injectableFactory->createWith(LayoutBuilder::class, ['scope' => $scope, 'layoutName' => $name]);
		$layoutBuilder->setLayout($layout);

		$this->applyAdditional($layoutBuilder);

		return JSON::encode($layout);
	}

	private function applyAdditional(LayoutBuilder $layoutBuilder): void {
		/** @var class-string<AdditionalBuilder>[] $builderClassNameList */
		$builderClassNameList = $this->metadata->get(['app', 'layout', 'additionalBuilderClassNameList'], []);

		/** @var AdditionalBuilder[] $builderList */
		$builderList = array_map(
			fn($className) => $this->injectableFactory->createWith($className, ['layoutBuilder' => $layoutBuilder]),
			$builderClassNameList
		);

		foreach ($builderList as $builder) {
			$builder->apply();
		}
	}

}
