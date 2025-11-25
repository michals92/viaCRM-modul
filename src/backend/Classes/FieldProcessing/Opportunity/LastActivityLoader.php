<?php

namespace Espo\Modules\Viacrm\Classes\FieldProcessing\Opportunity;

use Espo\Core\FieldProcessing\Loader as FieldLoader;
use Espo\Core\FieldProcessing\Loader\Params as LoaderParams;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Metadata;
use Espo\Entities\Email;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Crm\Entities\Call;
use Espo\Modules\Crm\Entities\Meeting;
use Espo\Modules\Crm\Entities\Opportunity;
use Espo\Modules\Crm\Tools\Activities\Service as ActivitiesService;
use Espo\ORM\Entity;
use Espo\ORM\Query\Part\Expression;
use Espo\ORM\Query\Part\Selection;

/**
 * @implements FieldLoader<Opportunity>
 */
class LastActivityLoader implements FieldLoader {

	public function __construct(
		protected readonly ActivitiesService $activitiesService,
		protected readonly Config $config,
		protected readonly Metadata $metadata,
		protected readonly EntityManager $entityManager
	) {}

	public function process(Entity $entity, LoaderParams $params): void {
		$select = $params->getSelect();

		// Set to null for early returns, if nothing is set, the field looks ugly in the UI 
		$entity->set('lastActivity', null);

		if (is_array($select) && !empty($select) && !in_array('lastActivity', $select)) {
			return;
		}

		$account = $this->entityManager->getRelation($entity, 'account')->findOne();

		if (!$account) {
			return;
		}

		$parts = [];

		/** @var string[] $entityTypeList */
		$entityTypeList = $this->config->get('historyEntityList') ??
		    [
		        Meeting::ENTITY_TYPE,
		        Call::ENTITY_TYPE,
		        Email::ENTITY_TYPE
		    ];

		foreach ($entityTypeList as $entityType) {
			if (!$this->metadata->get('scopes.' . $entityType . '.activity')) {
				continue;
			}

			$statusList = $this->metadata->get(['scopes', $entityType, 'historyStatusList']) ??
			    [Meeting::STATUS_HELD, Meeting::STATUS_NOT_HELD];

			$parts[$entityType] = ReflectionUtil::callMethod($this->activitiesService, 'getActivitiesQuery', $account, $entityType, $statusList);
		}

		$queryList = [];

		foreach ($parts as $part) {
			if (is_array($part)) {
				$queryList = array_merge($queryList, $part);
			} else {
				$queryList[] = $part;
			}
		}

		$builder = $this->entityManager
		    ->getQueryBuilder()
		    ->union();

		foreach ($queryList as $query) {
			$builder->query($query);
		}

		$query = $this->entityManager->getQueryBuilder()
		    ->select(
		    	Selection::create(
		    		Expression::max(
		    			Expression::alias('subQuery.dateStart')
		    		),
		    		'lastActivity'
		    	)
		    )->fromQuery($builder->build(), 'subQuery')
		    ->build();

		$result = $this->entityManager->getQueryExecutor()->execute($query)->fetchColumn();

		$entity->set('lastActivity', $result);
	}

}
