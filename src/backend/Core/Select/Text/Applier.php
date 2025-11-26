<?php

namespace Espo\Modules\Viacrm\Core\Select\Text;

use Espo\Core\Di;
use Espo\Core\Select\Text\FilterParams;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Query\SelectBuilder as QueryBuilder;
use ReflectionException;

class Applier extends \Espo\Core\Select\Text\Applier implements Di\MetadataAware {
	use Di\MetadataSetter;

	/**
	 * @throws ReflectionException
	 */
	public function apply(QueryBuilder $queryBuilder, string $filter, FilterParams $params): void {
		$forceFullText = false;

		if (mb_strpos($filter, 'ft:') === 0) {
			$filter = mb_substr($filter, 3);
			$forceFullText = true;
		}

		$fullTextData = ReflectionUtil::callClassMethod(parent::class, $this, 'composeFullTextSearchData', $filter);

		if ($fullTextData && !$forceFullText && $this->toSkipFullText($filter)) {
			$fullTextData = null;
		}

		$fullTextWhere = $fullTextData ?
			ReflectionUtil::callClassMethod(parent::class, $this, 'processFullTextSearch', $queryBuilder, $fullTextData) : null;

		$fieldList = ReflectionUtil::callClassMethod(parent::class, $this, 'getFieldList', $forceFullText, $fullTextData);
		$filterData = ReflectionUtil::callClassMethod(parent::class, $this, 'prepareFilterData', $filter, $fieldList, $forceFullText, $fullTextWhere);

		ReflectionUtil::callClassMethod(parent::class, $this, 'applyFilter', $queryBuilder, $filterData);
	}

	/**
	 * @throws ReflectionException
	 */
	private function toSkipFullText(string $filter): bool {
		$entityType = ReflectionUtil::getClassProperty(parent::class, $this, 'entityType');
		$config = ReflectionUtil::getClassProperty(parent::class, $this, 'config');

		$min = $this->metadata->get(['entityDefs', $entityType, 'fullTextMinWordLength'], $config->getFullTextSearchMinLength());

		if ($min === null || strlen($filter) >= $min) {
			return false;
		}

		return
			!str_contains($filter, '*') &&
			!str_contains($filter, '"') &&
			!str_contains($filter, '+') &&
			!str_contains($filter, '-');
	}
}
