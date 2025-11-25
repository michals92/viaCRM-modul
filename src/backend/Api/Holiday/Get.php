<?php

namespace Espo\Modules\Viacrm\Api\Holiday;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Field\Date;
use Espo\Modules\Viacrm\Classes\Utils\Common\LangCode;
use Espo\Modules\Viacrm\Classes\Utils\HolidayUtil;

class Get implements Action {

	private Request $request;

	public function __construct(
		private HolidayUtil $holidayUtil
	) {}

	/**
	 * @param  Request    $request
	 * @throws BadRequest
	 * @return Response
	 *
	 */
	public function process(Request $request): Response {
		$this->request = $request;
		$year = $this->getFormattedRouteParam('year');
		$month = $this->getFormattedRouteParam('month', false);
		$day = $this->getFormattedRouteParam('day', false);
		$publicOnly = $request->getQueryParam('publicOnly') === 'true';

		$langCode = $request->getQueryParam('langCode') ?? LangCode::cs_CZ;

		assert($year !== null);

		if ($day === null) {
			if ($publicOnly) {
				$holidays = $this->holidayUtil->fetchPublicHolidays(year: $year, month: $month, langCode: $langCode);
			} else {
				$holidays = $this->holidayUtil->fetchHolidays(year: $year, month: $month, langCode: $langCode);
			}
			$list = $holidays->getValueMapList();
			array_walk($list, static function (&$item) {
				unset($item->id);
			});
		} else {
			$date = new Date("$year-$month-$day");
			$holiday = $this->holidayUtil->getHoliday($date, $langCode);
			$valueMap = $holiday->getValueMap();
			unset($valueMap->id);
			$list = [$valueMap];
		}

		return ResponseComposer::json(['list' => $list, 'total' => count($list)]);
	}

	/**
	 * @throws BadRequest
	 */
	private function getFormattedRouteParam(string $name, bool $required = true): ?string {
		$value = $this->request->getRouteParam($name);

		if ($value === null) {
			if (!$required) {
				return null;
			}

			throw new BadRequest("Missing required parameter: $name.");
		}

		if ($name === 'year') {
			if (strlen($value) !== 4) {
				$value = "20$value";
			}

			return $value;
		}

		if (strlen($value) === 1) {
			$value = "0$value";
		}

		return $value;
	}

}
