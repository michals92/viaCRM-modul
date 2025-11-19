<?php

namespace Espo\Modules\Autocrm\Tools\Calendar;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Field\DateTime as DateTimeField;
use Espo\Core\InjectableFactory;
use Espo\Core\ServiceFactory;
use Espo\Core\Utils\FieldUtil;
use Espo\Core\Utils\Json;
use Espo\Entities\User;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Crm\Entities\Call;
use Espo\Modules\Crm\Entities\Meeting;
use Espo\Modules\Crm\Entities\Task;
use Espo\Modules\Crm\Tools\Calendar\FetchParams;
use Espo\Modules\Crm\Tools\Calendar\Items\Event;
use Espo\Modules\Crm\Tools\Calendar\Service as CalendarService;
use Espo\ORM\Query\Part\Expression;
use Espo\ORM\Query\Part\Expression\Util;
use Espo\ORM\Query\Select;
use Espo\Tools\LayoutManager\LayoutManager;
use JsonException;
use PDO;
use ReflectionClass;
use RuntimeException;
use stdClass;

class Service extends CalendarService {

	public function __construct(
		private readonly LayoutManager $layoutManager,
		private readonly FieldUtil $fieldUtil,
		InjectableFactory $injectableFactory
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod($injectableFactory, 'getConstructorInjectionList', new ReflectionClass(parent::class));

		parent::__construct(...$parentConstructorArgs);
	}

	/**
	 * @throws \ReflectionException
	 * @throws NotFound
	 */
	public function fetch(string $userId, FetchParams $fetchParams): array {
		$from = $fetchParams->getFrom()->toString();
		$to = $fetchParams->getTo()->toString();
		$scopeList = $fetchParams->getScopeList();
		$skipAcl = $fetchParams->skipAcl();

		$entityManager = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager');
		$config = ReflectionUtil::getClassProperty(parent::class, $this, 'config');
		$workingCalendarFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'workingCalendarFactory');
		$acl = ReflectionUtil::getClassProperty(parent::class, $this, 'acl');
		$metadata = ReflectionUtil::getClassProperty(parent::class, $this, 'metadata');

		/** @var ?User $user */
		$user = $entityManager->getEntityById(User::ENTITY_TYPE, $userId);

		if (!$user) {
			throw new NotFound();
		}

		ReflectionUtil::callClassMethod(CalendarService::class, $this, 'accessCheck', $user);

		$calendarEntityList = $config->get('calendarEntityList', []);

		if (is_null($scopeList)) {
			$scopeList = $calendarEntityList;
		}

		$workingRangeItemList = [];

		if ($fetchParams->workingTimeRanges() || $fetchParams->workingTimeRangesInverted()) {
			$workingCalendar = $workingCalendarFactory->createForUser($user);

			$workingRangeItemList = $workingCalendar->isAvailable() ?
			    ReflectionUtil::callClassMethod(CalendarService::class, $this, 'getWorkingRangeList', $workingCalendar, $fetchParams) : [];
		}

		$queryList = [];

		foreach ($scopeList as $scope) {
			if (!in_array($scope, $calendarEntityList, true)) {
				continue;
			}

			if (!$acl->checkScope($scope)) {
				continue;
			}

			if (!$metadata->get(['scopes', $scope, 'calendar'])) {
				continue;
			}

			/** @var Select $query */
			$query = $this->getCalendarQuery($scope, $userId, $from, $to, $skipAcl);

			$attributeList = $this->fetchAttributeListFromLayout($scope) ?? ['name'];
			$attributeList[] = $metadata->get(['app', $scope, 'iconClassFieldName'], 'iconClass');
			$args = [];

			foreach ($attributeList as $attribute) {
				if (
					$entityManager
						->getDefs()
						->getEntity($scope)
						->hasAttribute($attribute)
				) {
					$args[] = Expression::value($attribute);
					$args[] = Expression::column($attribute);
				}
			}

			$expression = Util::composeFunction('JSON_OBJECT', ...$args);

			$query = $entityManager
			    ->getQueryBuilder()
			    ->select()
			    ->clone($query)
			    ->select($expression, 'attributes')
			    ->build();

			$queryList[] = $query;
		}

		if ($queryList === []) {
			return $workingRangeItemList;
		}

		$builder = $entityManager
		    ->getQueryBuilder()
		    ->union();

		foreach ($queryList as $query) {
			$builder->query($query);
		}

		$unionQuery = $builder->build();

		$sth = $entityManager->getQueryExecutor()->execute($unionQuery);

		$rowList = $sth->fetchAll(PDO::FETCH_ASSOC) ?: [];

		$eventList = [];

		foreach ($rowList as $row) {
			$row['attributes'] = json_decode($row['attributes'], true);

			$eventList[] = (new Event(
				$row['dateStart'] ? DateTimeField::fromString($row['dateStart']) : null,
				$row['dateEnd'] ? DateTimeField::fromString($row['dateEnd']) : null,
				$row['scope'],
				$row
			));
		}

		return array_merge($eventList, $workingRangeItemList);
	}

	/**
	 * @return string[]|null
	 */
	protected function fetchAttributeListFromLayout(string $entityType): ?array {
		$layout = $this->layoutManager->get($entityType, 'calendar');

		if (!$layout) {
			return null;
		}

		try {
			$layout = Json::decode($layout);
		} catch (JsonException) {
			return null;
		}

		$fields = array_map(static fn(stdClass $item) => $item->name, $layout);
		$attributes = [];

		foreach ($fields as $field) {
			foreach ($this->fieldUtil->getAttributeList($entityType, $field) as $attribute) {
				$attributes[] = $attribute;
			}
		}

		return $attributes;
	}

	private function getCalendarQuery(
		string $scope,
		string $userId,
		string $from,
		string $to,
		bool $skipAcl = false
	): Select {
		$metadata = ReflectionUtil::getClassProperty(parent::class, $this, 'metadata');
		/** @var ServiceFactory $serviceFactory */
		$serviceFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'serviceFactory');

		$clientDefs = $metadata->getCustom('clientDefs', $scope, null);

		$calendarDateStart = $clientDefs?->calendarDateStart ?? null;
		$calendarDateEnd = $clientDefs?->calendarDateEnd ?? null;

		if ($serviceFactory->checkExists($scope)) {
			// For backward compatibility.
			$service = $serviceFactory->create($scope);

			if (method_exists($service, 'getCalenderQuery')) {
				return $service->getCalenderQuery($userId, $from, $to, $skipAcl);
			}
		}

		if ($scope === Meeting::ENTITY_TYPE) {
			return $this->getCalendarMeetingQuery($userId, $from, $to, $skipAcl);
		}

		if ($scope === Call::ENTITY_TYPE) {
			return $this->getCalendarCallQuery($userId, $from, $to, $skipAcl);
		}

		if ($scope === Task::ENTITY_TYPE) {
			return $this->getCalendarTaskQuery($userId, $from, $to, $skipAcl, $calendarDateStart, $calendarDateEnd);
		}

		return $this->getCalenderBaseQuery($scope, $userId, $from, $to, $skipAcl);
	}

	protected function getCalenderBaseQuery(
		string $scope,
		string $userId,
		string $from,
		string $to,
		bool $skipAcl = false
	): Select {
		$selectBuilderFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'selectBuilderFactory');
		$entityManager = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager');
		$metadata = ReflectionUtil::getClassProperty(parent::class, $this, 'metadata');

		$builder = $selectBuilderFactory
		    ->create()
		    ->from($scope);

		if (!$skipAcl) {
			$builder->withStrictAccessControl();
		}

		$seed = $entityManager->getNewEntity($scope);

		$select = [
		    ['"' . $scope . '"', 'scope'],
		    'id',
		    'name',
		    ['dateStart', 'dateStart'],
		    ['dateEnd', 'dateEnd'],
		    ($seed->hasAttribute('status') ? ['status', 'status'] : ['null', 'status']),
		    ($seed->hasAttribute('dateStartDate') ? ['dateStartDate', 'dateStartDate'] : ['null', 'dateStartDate']),
		    ($seed->hasAttribute('dateEndDate') ? ['dateEndDate', 'dateEndDate'] : ['null', 'dateEndDate']),
		    ($seed->hasAttribute('parentType') ? ['parentType', 'parentType'] : ['null', 'parentType']),
		    ($seed->hasAttribute('parentId') ? ['parentId', 'parentId'] : ['null', 'parentId']),
		    'createdAt',
		];

		$additionalAttributeList = $metadata->get(['app', 'calendar', 'additionalAttributeList'], []);

		foreach ($additionalAttributeList as $attribute) {
			$select[] = $seed->hasAttribute($attribute) ?
			    [$attribute, $attribute] :
			    ['null', $attribute];
		}

		$orGroup = [
		    'assignedUserId' => $userId,
		];

		if ($seed->hasRelation('users')) {
			$orGroup['usersMiddle.userId'] = $userId;
		}

		if ($seed->hasRelation('assignedUsers')) {
			$orGroup['assignedUsersMiddle.userId'] = $userId;
		}

		try {
			$queryBuilder = $builder
			    ->buildQueryBuilder()
			    ->select($select)
			    ->where([
			        'OR' => $orGroup,
			        [
			            'OR' => [
			                [
			                    'dateEnd' => null,
			                    'dateStart>=' => $from,
			                    'dateStart<' => $to,
			                ],
			                [
			                    'dateStart>=' => $from,
			                    'dateStart<' => $to,
			                ],
			                [
			                    'dateEnd>=' => $from,
			                    'dateEnd<' => $to,
			                ],
			                [
			                    'dateStart<=' => $from,
			                    'dateEnd>=' => $to,
			                ],
			                [
			                    'dateEndDate!=' => null,
			                    'dateEndDate>=' => $from,
			                    'dateEndDate<' => $to,
			                ],
			            ],
			        ],
			    ]);
		} catch (BadRequest | Forbidden $e) {
			throw new RuntimeException($e->getMessage());
		}

		if ($seed->hasRelation('users')) {
			$queryBuilder
			    ->distinct()
			    ->leftJoin('users');
		}

		if ($seed->hasRelation('assignedUsers')) {
			$queryBuilder
			    ->distinct()
			    ->leftJoin('assignedUsers');
		}

		return $queryBuilder->build();
	}

	protected function getCalendarMeetingQuery(string $userId, string $from, string $to, bool $skipAcl): Select {
		$selectBuilderFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'selectBuilderFactory');
		$entityManager = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager');
		$metadata = ReflectionUtil::getClassProperty(parent::class, $this, 'metadata');

		$builder = $selectBuilderFactory
		    ->create()
		    ->from(Meeting::ENTITY_TYPE);

		if (!$skipAcl) {
			$builder->withStrictAccessControl();
		}

		$select = [
		    ['"Meeting"', 'scope'],
		    'id',
		    'name',
		    ['dateStart', 'dateStart'],
		    ['dateEnd', 'dateEnd'],
		    'status',
		    ['dateStartDate', 'dateStartDate'],
		    ['dateEndDate', 'dateEndDate'],
		    'parentType',
		    'parentId',
		    'createdAt',
		];

		$seed = $entityManager->getNewEntity(Meeting::ENTITY_TYPE);

		$additionalAttributeList = $metadata->get(['app', 'calendar', 'additionalAttributeList']);

		foreach ($additionalAttributeList as $attribute) {
			$select[] = $seed->hasAttribute($attribute) ?
			    [$attribute, $attribute] :
			    ['null', $attribute];
		}

		try {
			return $builder
			    ->buildQueryBuilder()
			    ->select($select)
			    ->leftJoin('users')
			    ->where([
			        'usersMiddle.userId' => $userId,
			        'usersMiddle.status!=' => Meeting::ATTENDEE_STATUS_DECLINED,
			        'OR' => [
			            [
			                'dateStart>=' => $from,
			                'dateStart<' => $to,
			            ],
			            [
			                'dateEnd>=' => $from,
			                'dateEnd<' => $to,
			            ],
			            [
			                'dateStart<=' => $from,
			                'dateEnd>=' => $to,
			            ],
			        ],
			    ])
			    ->build();
		} catch (BadRequest | Forbidden $e) {
			throw new RuntimeException($e->getMessage());
		}
	}

	protected function getCalendarCallQuery(string $userId, string $from, string $to, bool $skipAcl): Select {
		$selectBuilderFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'selectBuilderFactory');
		$entityManager = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager');
		$metadata = ReflectionUtil::getClassProperty(parent::class, $this, 'metadata');

		$builder = $selectBuilderFactory
		    ->create()
		    ->from(Call::ENTITY_TYPE);

		if (!$skipAcl) {
			$builder->withStrictAccessControl();
		}

		$select = [
		    ['"Call"', 'scope'],
		    'id',
		    'name',
		    ['dateStart', 'dateStart'],
		    ['dateEnd', 'dateEnd'],
		    'status',
		    ['null', 'dateStartDate'],
		    ['null', 'dateEndDate'],
		    'parentType',
		    'parentId',
		    'createdAt',
		];

		$seed = $entityManager->getNewEntity(Call::ENTITY_TYPE);

		$additionalAttributeList = $metadata->get(['app', 'calendar', 'additionalAttributeList'], []);

		foreach ($additionalAttributeList as $attribute) {
			$select[] = $seed->hasAttribute($attribute) ?
			    [$attribute, $attribute] :
			    ['null', $attribute];
		}

		try {
			return $builder
			    ->buildQueryBuilder()
			    ->select($select)
			    ->leftJoin('users')
			    ->where([
			        'usersMiddle.userId' => $userId,
			        'usersMiddle.status!=' => Meeting::ATTENDEE_STATUS_DECLINED,
			        'OR' => [
			            [
			                'dateStart>=' => $from,
			                'dateStart<' => $to,
			            ],
			            [
			                'dateEnd>=' => $from,
			                'dateEnd<' => $to,
			            ],
			            [
			                'dateStart<=' => $from,
			                'dateEnd>=' => $to,
			            ],
			        ],
			    ])
			    ->build();
		} catch (BadRequest | Forbidden $e) {
			throw new RuntimeException($e->getMessage());
		}
	}

	protected function getCalendarTaskQuery(
		string $userId,
		string $from,
		string $to,
		bool $skipAcl,
		?string $startField = null,
		?string $endField = null
	): Select {
		$selectBuilderFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'selectBuilderFactory');
		$entityManager = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager');
		$metadata = ReflectionUtil::getClassProperty(parent::class, $this, 'metadata');

		$builder = $selectBuilderFactory
		    ->create()
		    ->from(Task::ENTITY_TYPE);

		if (!$skipAcl) {
			$builder->withStrictAccessControl();
		}

		if ($startField) {
			$startFieldType = $entityManager
			    ->getDefs()
			    ->getEntity(Task::ENTITY_TYPE)
			    ->getField($startField)
			    ->getType();

			[$startFieldSelect, $startFieldDateSelect] = match ($startFieldType) {
				'datetime' => [
				    Expression::column($startField),
				    Expression::date(Expression::column($startField)),
				],
				'datetimeOptional' =>  [
				    Expression::column($startField),
				    Expression::column($startField . 'Date')
				],
				'date' => [
				    Expression::concat(
				    	Expression::column($startField),
				    	Expression::value(' 00:00:00')
				    ),
				    Expression::column($startField)
				],
				default => [
				    Expression::column($startField),
				    Expression::date(Expression::column($startField)),
				],
			};
		} else {
			$startFieldSelect = Expression::column('dateStart');
			$startFieldDateSelect = Expression::column('dateStartDate');
		}

		if ($endField) {
			$endFieldType = $entityManager
			    ->getDefs()
			    ->getEntity(Task::ENTITY_TYPE)
			    ->getField($endField)
			    ->getType();

			[$endFieldSelect, $endFieldDateSelect] = match ($endFieldType) {
				'datetime' => [
				    Expression::column($endField),
				    Expression::date(Expression::column($endField)),
				],
				'datetimeOptional' =>  [
				    Expression::column($endField),
				    Expression::column($endField . 'Date'),
				],
				'date' => [
				    Expression::concat(
				    	Expression::column($endField),
				    	Expression::value(' 23:59:59')
				    ),
				    Expression::column($endField),
				],
				default => [
				    Expression::column($endField),
				    Expression::date(Expression::column($endField)),
				],
			};
		} else {
			$endFieldSelect = Expression::column('dateEnd');
			$endFieldDateSelect = Expression::column('dateEndDate');
		}

		$select = [
		    [Expression::value(Task::ENTITY_TYPE), 'scope'],
		    'id',
		    'name',
		    [$startFieldSelect, 'dateStart'],
		    [$endFieldSelect, 'dateEnd'],
		    'status',
		    [$startFieldDateSelect, 'dateStartDate'],
		    [$endFieldDateSelect, 'dateEndDate'],
		    'parentType',
		    'parentId',
		    'createdAt',
		];

		$seed = $entityManager->getNewEntity(Task::ENTITY_TYPE);

		$additionalAttributeList = $metadata->get(['app', 'calendar', 'additionalAttributeList'], []);

		foreach ($additionalAttributeList as $attribute) {
			$select[] = $seed->hasAttribute($attribute) ?
			    [$attribute, $attribute] :
			    ['null', $attribute];
		}

		try {
			$queryBuilder = $builder
			    ->buildQueryBuilder()
			    ->select($select)
			    ->where(
			    	Expression::or(
			    		Expression::and(
			    			Expression::isNull($endFieldSelect),
			    			Expression::greaterOrEqual($startFieldSelect, $from),
			    			Expression::less($startFieldSelect, $to)
			    		),
			    		Expression::and(
			    			Expression::greaterOrEqual($startFieldSelect, $from),
			    			Expression::less($startFieldSelect, $to)
			    		),
			    		Expression::and(
			    			Expression::greaterOrEqual($endFieldSelect, $from),
			    			Expression::less($endFieldSelect, $to)
			    		),
			    		Expression::and(
			    			Expression::lessOrEqual($startFieldSelect, $from),
			    			Expression::greaterOrEqual($endFieldSelect, $to)
			    		),
			    		Expression::and(
			    			Expression::isNotNull($endFieldDateSelect),
			    			Expression::greaterOrEqual($endFieldDateSelect, $from),
			    			Expression::less($endFieldDateSelect, $to)
			    		)
			    	)
			    );
		} catch (BadRequest | Forbidden $e) {
			throw new RuntimeException($e->getMessage());
		}

		if (
			$metadata->get(['entityDefs', 'Task', 'fields', 'assignedUsers', 'type']) === 'linkMultiple' &&
			!$metadata->get(['entityDefs', 'Task', 'fields', 'assignedUsers', 'disabled'])
		) {
			$queryBuilder
			    ->distinct()
			    ->leftJoin('assignedUsers', 'assignedUsers')
			    ->where([
			        'assignedUsers.id' => $userId,
			    ]);
		} else {
			$queryBuilder->where([
			    'assignedUserId' => $userId,
			]);
		}

		return $queryBuilder->build();
	}

}
