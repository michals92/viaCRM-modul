<?php

namespace Espo\Modules\Viacrm\Tools\Activities;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Entities\User;
use Espo\Modules\Crm\Entities\Meeting;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Query\Select;
use RuntimeException;

/**
 * Class Service
 * This exists only because of Postgres. Line 46 has to be changed from 'null' to 'false' to avoid an sql error.
 */
class Service extends \Espo\Modules\Crm\Tools\Activities\Service {
	/**
	 * @param string[] $statusList
	 */
	protected function getActivitiesUserMeetingQuery(User $entity, array $statusList = []): Select {
		try {
			$selectBuilderFactory = ReflectionUtil::getClassProperty(
				\Espo\Modules\Crm\Tools\Activities\Service::class,
				$this,
				'selectBuilderFactory'
			);

			$builder = $selectBuilderFactory
			    ->create()
			    ->from(Meeting::ENTITY_TYPE)
			    ->withStrictAccessControl()
			    ->buildQueryBuilder()
			    ->select([
			        'id',
			        'name',
			        ['dateStart', 'dateStart'],
			        ['dateEnd', 'dateEnd'],
			        ['dateStartDate', 'dateStartDate'],
			        ['dateEndDate', 'dateEndDate'],
			        ['"Meeting"', '_scope'],
			        'assignedUserId',
			        'assignedUserName',
			        'parentType',
			        'parentId',
			        'status',
			        'createdAt',
			        ['false', 'hasAttachment'], // Changed from 'null' to 'false'
			    ])
			    ->leftJoin(
			    	'MeetingUser',
			    	'usersLeftMiddle',
			    	[
			    	    'usersLeftMiddle.meetingId:' => 'meeting.id',
			    	]
			    );
		} catch (BadRequest | Forbidden $e) {
			throw new RuntimeException($e->getMessage());
		}

		$where = [
		    'usersLeftMiddle.userId' => $entity->getId(),
		];

		if ($entity->isPortal() && $entity->get('contactId')) {
			$where['contactsLeftMiddle.contactId'] = $entity->get('contactId');

			$builder
			    ->leftJoin('contacts', 'contactsLeft')
			    ->distinct()
			    ->where([
			        'OR' => $where,
			    ]);
		} else {
			$builder->where($where);
		}

		if (!empty($statusList)) {
			$builder->where([
			    'status' => $statusList,
			]);
		}

		return $builder->build();
	}
}
