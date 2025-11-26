<?php

namespace Espo\Modules\Viacrm\Tools\GlobalSearch;

use Espo\Core\InjectableFactory;
use Espo\Core\Record\Collection;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\FieldUtil;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Entity;
use Espo\ORM\EntityCollection;
use Espo\ORM\EntityManager;
use ReflectionClass;

class Service extends \Espo\Tools\GlobalSearch\Service
{
	public function __construct(
		InjectableFactory $injectableFactory,
		protected readonly EntityManager $entityManager,
		protected readonly Metadata $metadata,
		protected readonly Config $config,
		private readonly FieldUtil $fieldUtil
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod(
			$injectableFactory,
			'getConstructorInjectionList',
			new ReflectionClass(parent::class)
		);

		parent::__construct(...$parentConstructorArgs);
	}

	/**
	 * @param string   $filter  a search query
	 * @param int|null $offset  an offset
	 * @param ?int     $maxSize a limit
	 *
	 * @return Collection<Entity>
	 */
	public function find(string $filter, ?int $offset = 0, ?int $maxSize = null): Collection
	{
		$entityTypeList = $this->config->get('globalSearchEntityList', []);
		$maxSize ??= (int) $this->config->get('recordsPerPage');
		$offset ??= 0;

		$hasFullTextSearch = false;

		$queryList = [];

		foreach ($entityTypeList as $i => $entityType) {
			// Use ReflectionMethod directly to preserve the by-reference parameter
			// ReflectionUtil::callMethod doesn't preserve references, so we need invokeArgs
			$method = new \ReflectionMethod($this, 'getEntityTypeQuery');
			$query = $method->invokeArgs($this, [
				$entityType,
				$i,
				$filter,
				$offset,
				$maxSize,
				&$hasFullTextSearch,
			]);

			if (!$query) {
				continue;
			}

			$queryList[] = $query;
		}

		if (count($queryList) === 0) {
			return new Collection(new EntityCollection(), 0);
		}

		$builder = $this->entityManager->getQueryBuilder()
			->union()
			->all()
			->limit($offset, $maxSize + 1);

		foreach ($queryList as $query) {
			$builder->query($query);
		}

		// @phpstan-ignore if.alwaysFalse (modified by reference in getEntityTypeQuery via reflection)
		if ($hasFullTextSearch) {
			$builder->order('relevance', 'DESC');
		}

		$builder->order('order', 'DESC');
		$builder->order('name', 'ASC');

		$unionQuery = $builder->build();

		$collection = new EntityCollection();

		$sth = $this->entityManager->getQueryExecutor()->execute($unionQuery);

		while ($row = $sth->fetch()) {
			$globalSearchDisplayFields = $this->metadata->getCustom('clientDefs', $row['entityType'])?->globalSearchDisplayFields ?? [];

			$additionalAttributes = [];

			foreach ($globalSearchDisplayFields as $field) {
				foreach ($this->fieldUtil->getAttributeList($row['entityType'], $field) as $attribute) {
					$additionalAttributes[] = $attribute;
				}
			}

			$entity = $this->entityManager
				->getRDBRepository($row['entityType'])
				->select(['id', 'name', ...$additionalAttributes])
				->where(['id' => $row['id']])
				->findOne();

			if (!$entity) {
				continue;
			}

			$collection->append($entity);
		}

		return Collection::createNoCount($collection, $maxSize);
	}
}
