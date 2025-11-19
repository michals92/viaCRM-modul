<?php

namespace Espo\Modules\Autocrm\Tools\Xml\Data;

use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;
use Espo\ORM\Entity;
use Espo\Tools\Pdf\Data as PdfData;
use Espo\Tools\Pdf\Params as PdfParams;

class DataLoaderManager {

	public function __construct(
		private Metadata $metadata,
		private InjectableFactory $injectableFactory
	) {}

	public function load(Entity $entity, ?PdfParams $params = null, ?PdfData $data = null): PdfData {
		if (!$params) {
			$params = PdfParams::create();
		}

		if (!$data) {
			$data = PdfData::create();
		}

		/** @var class-string<DataLoader>[] $classNameList */
		$classNameList = $this->metadata->get(['xmlDefs', $entity->getEntityType(), 'dataLoaderClassNameList']) ?? [];

		foreach ($classNameList as $className) {
			$loader = $this->createLoader($className);

			$loadedData = $loader->load($entity, $params);

			$data = $data->withAdditionalTemplateData($loadedData);
		}

		return $data;
	}

	/**
	 * @param class-string<DataLoader> $className
	 */
	private function createLoader(string $className): DataLoader {
		return $this->injectableFactory->create($className);
	}

}
