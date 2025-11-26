<?php

namespace Espo\Modules\Viacrm\Classes\RecordHooks\Email;

use Espo\Core\Record\Hook\ReadHook;
use Espo\Core\Record\ReadParams;
use Espo\Entities\Email;
use Espo\Entities\Preferences;
use Espo\Modules\Viacrm\Core\Email\ReadParams as ViaCrmEmailReadParams;
use Espo\ORM\Entity;
use Espo\Tools\Email\InboxService;

/**
 * @implements ReadHook<Email>
 */
readonly class MarkAsRead implements ReadHook {
	public function __construct(
		private InboxService $inboxService,
		private Preferences  $preferences
	) {}

	public function process(Entity $entity, ReadParams $params): void {
		if ($entity->isRead()) {
			return;
		}

		if (!$params instanceof ViaCrmEmailReadParams) {
			throw new \RuntimeException('Invalid read params');
		}

		$emailDoNotMarkAsReadList = $this->preferences->get('emailDoNotMarkAsReadList') ?? [];
		$readType = $params->getReadType();

		if (in_array($readType, $emailDoNotMarkAsReadList, true)) {
			return;
		}

		$this->inboxService->markAsRead($entity->getId());
	}
}
