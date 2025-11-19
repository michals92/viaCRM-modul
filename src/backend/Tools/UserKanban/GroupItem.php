<?php

namespace Espo\Modules\Autocrm\Tools\UserKanban;

use Espo\Core\Record\Collection;
use Espo\ORM\Entity;
use stdClass;

class GroupItem extends \Espo\Tools\Kanban\GroupItem {

	/**
	 * @param Collection<Entity> $collection
	 */
	public function __construct(
		string $name,
		Collection $collection,
		?string $label = null,
		?string $style = null,
		readonly public ?string $color = null,
	) {
		parent::__construct($name, $collection, $label, $style);
	}

	public function toRaw(): stdClass {
		$raw = parent::toRaw();

		$raw->color = $this->color;

		return $raw;
	}

}
