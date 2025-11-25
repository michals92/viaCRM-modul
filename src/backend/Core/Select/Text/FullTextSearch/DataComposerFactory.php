<?php

namespace Espo\Modules\Viacrm\Core\Select\Text\FullTextSearch;

use Espo\Core\Di;
use Espo\Core\Select\Text\FullTextSearch\DataComposer;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use ReflectionException;

class DataComposerFactory extends \Espo\Core\Select\Text\FullTextSearch\DataComposerFactory implements Di\MetadataAware {
	use Di\MetadataSetter;

	/**
	 * @throws ReflectionException
	 */
	public function create(string $entityType): DataComposer {
		$className = $this->getClassName($entityType);

		return ReflectionUtil::getClassProperty(Parent::class, $this, 'injectableFactory')
			->createWith($className, [
				'entityType' => $entityType,
			]);
	}

	/**
	 * @return class-string<DataComposer>
	 */
	private function getClassName(string $entityType): string {
		return $this->metadata->get([
			'selectDefs', $entityType, 'fullTextSearchDataComposerClassName'
		]) ?? DefaultDataComposer::class;
	}

}
