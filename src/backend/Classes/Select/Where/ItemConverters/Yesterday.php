<?php

namespace Espo\Modules\Viacrm\Classes\Select\Where\ItemConverters;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Field\DateTime;
use Espo\Core\Select\Where\Item as WhereItem;
use Espo\Core\Select\Where\Item\Data;
use Espo\Core\Select\Where\ItemConverter;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\DateTime as DateTimeUtil;
use Espo\ORM\Query\Part\WhereClause;
use Espo\ORM\Query\Part\WhereItem as WhereClauseItem;
use Espo\ORM\Query\SelectBuilder;

class Yesterday implements ItemConverter
{
	public function __construct(
		private readonly Config $config
	) {
	}

	/**
	 * @throws BadRequest
	 */
	public function convert(SelectBuilder $queryBuilder, WhereItem $item): WhereClauseItem
	{
		$attribute = $item->getAttribute();

		if (!$attribute) {
			throw new BadRequest("Bad where item. No 'attribute'.");
		}

		$timeZone = $this->getTimeZone($item->getData());
		$yesterday = DateTime::createNow()
			->withTimezone($timeZone)
			->addDays(-1);

		return WhereClause::fromRaw([
			$attribute . '=' => $yesterday->toDateTime()->format(DateTimeUtil::SYSTEM_DATE_FORMAT),
		]);
	}

	/**
	 * @throws BadRequest
	 */
	private function getTimeZone(?Data $data): \DateTimeZone
	{
		$timeZone = $data instanceof Data\Date ? $data->getTimeZone() : null;

		if (!$timeZone) {
			$timeZone = $this->config->get('timeZone') ?? 'UTC';
		}

		try {
			return new \DateTimeZone($timeZone);
		} catch (\Exception $e) {
			throw new BadRequest($e->getMessage());
		}
	}
}
