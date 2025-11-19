<?php

namespace Espo\Modules\Autocrm\Tools\EmailFolder;

use Espo\Core\Exceptions\ForbiddenSilent;
use Espo\Core\Exceptions\NotFound;

/**
 * This exists purely so that default hardcoded folders can have icons
 */
class Service extends \Espo\Tools\EmailFolder\Service {

	/**
	 * @throws ForbiddenSilent
	 * @throws NotFound
	 * @return array<array<string, mixed>>
	 */
	public function listAll(?string $userId = null) {
		$list = parent::listAll($userId);

		foreach ($list as &$folder) {
			switch ($folder['id']) {
				case 'inbox':
					$folder['iconClass'] = 'fas fa-inbox';
					break;
				case 'important':
					$folder['iconClass'] = 'fas fa-star';
					break;
				case 'sent':
					$folder['iconClass'] = 'fas fa-paper-plane';
					break;
				case 'archive':
					$folder['iconClass'] = 'fas fa-folder';
					break;
				case 'drafts':
					$folder['iconClass'] = 'fas fa-file';
					break;
				case 'trash':
					$folder['iconClass'] = 'fas fa-trash-alt';
					break;
				default:
			}
		}

		return $list;
	}

}
