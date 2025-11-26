<?php

namespace Espo\Modules\Viacrm\Services;

use Espo\Modules\Viacrm\Entities\CurrencyRateHistoryRecord as CurrencyRateHistoryRecordEntity;
use Espo\ORM\Query\Part\Expression;
use Espo\Services\Record;

/**
 * @extends Record<CurrencyRateHistoryRecordEntity>
 */
class CurrencyRateHistoryRecord extends Record {
	/**
	 * Get historical currency rate for a given currency code and date.
	 *
	 * Returns the first rate recorded on or after the specified date.
	 */
	public function getHistoricalRate(string $currencyCode, string $date): ?float {
		return $this
		    ->entityManager
		    ->getRDBRepository(CurrencyRateHistoryRecordEntity::ENTITY_TYPE)
		    ->where(
		    	Expression::greaterOrEqual(
		    		Expression::date(
		    			Expression::column('createdAt')
		    		),
		    		Expression::date(Expression::value($date))
		    	)
		    )
		    ->where('name', $currencyCode)
		    ->order('createdAt', 'ASC')
		    ->findOne()
		    ?->get('rate');
	}
}
