<?php

namespace Espo\Modules\Autocrm\Classes\Select\Alert\PrimaryFilters;

use Espo\Core\Select\Primary\Filter;
use Espo\Core\Utils\Metadata;
use Espo\ORM\Query\SelectBuilder;

class Active implements Filter {

	public const NAME = 'active';

	public function __construct(
		private readonly string   $entityType,
		private readonly Metadata $metadata
	) {}

	public function apply(SelectBuilder $queryBuilder): void {
		$statusList = $this->metadata->get(['scopes', $this->entityType, 'activityStatusList'], []);

		$queryBuilder->where(['status' => $statusList]);
	}

}
