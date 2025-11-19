<?php

namespace Espo\Modules\Autocrm\Classes\AppParams;

use Espo\Core\Select\SelectBuilderFactory;
use Espo\ORM\EntityManager;
use Espo\Tools\App\AppParam;

class RecordTemplateEntityTypeList implements AppParam {

	public function __construct(
		private readonly SelectBuilderFactory $selectBuilderFactory,
		private readonly EntityManager $entityManager,
	) {}

	public function get(): mixed {
		$list = [];

		$query = $this->selectBuilderFactory->create()
		    ->from('RecordTemplate')
		    ->withStrictAccessControl()
		    ->buildQueryBuilder()
		    ->select(['entityType'])
		    ->group(['entityType'])
		    ->build();

		$templateCollection = $this->entityManager
		    ->getRDBRepository('RecordTemplate')
		    ->clone($query)
		    ->find();

		foreach ($templateCollection as $template) {
			$list[] = $template->get('entityType');
		}

		return $list;
	}

}