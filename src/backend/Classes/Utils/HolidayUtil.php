<?php

namespace Espo\Modules\Autocrm\Classes\Utils;

use DateTime;
use Espo\Core\Field\Date;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Log;
use Espo\Core\Utils\Util;
use Espo\Modules\Autocrm\Classes\Utils\Common\LangCode;
use Espo\Modules\Autocrm\Entities\Holiday;
use Espo\ORM\EntityCollection;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\Part\Expression as Expr;
use Espo\ORM\Query\Part\WhereItem;

readonly class HolidayUtil {

	public function __construct(
		private EntityManager $entityManager,
		private Log           $log
	) {}

	/** @deprecated Use isPublicHoliday instead */
	public function isHoliday(DateTime $dateTime): bool {
		return $this->isPublicHoliday($dateTime);
	}

	public function isPublicHoliday(DateTime $dateTime, string $langCode = LangCode::cs_CZ): bool {
		$date = $dateTime->format('Y-m-d');
		$year = $dateTime->format('Y');

		$this->fetchHolidays($year, null, [], $langCode);

		$count = $this->entityManager
			->getRDBRepository(Holiday::ENTITY_TYPE)
			->where([
				'date' => $date,
				'holidayName!=' => null,
				'langCode' => $langCode,
			])
			->count();

		return $count > 0;
	}

	/**
	 * @param  WhereItem[]               $options
	 * @return EntityCollection<Holiday>
	 */
	public function fetchHolidays(string $year, ?string $month = null, array $options = [], string $langCode = LangCode::cs_CZ): EntityCollection {
		$existingHolidays = $this->getHolidayCollection($year, $month, $options, $langCode);
		$expectedHolidaysCount = $month ? 28 : 364;

		if ($existingHolidays->count() < $expectedHolidaysCount) {
			try {
				$formattedMonth = $month ? self::getFormattedMonth($month) : '01';
				$interval = $month ? 31 : 365;
				$url = "https://svatkyapi.cz/api/day/$year-$formattedMonth-01/interval/$interval";
				$json = file_get_contents($url);
				if ($json === false) {
					throw new \RuntimeException('Failed to fetch holiday data from: ' . $url);
				}
				$data = Json::decode($json, true);

				$tm = $this->entityManager->getTransactionManager();
				/** @var EntityCollection<Holiday> $existingHolidays */
				$existingHolidays = $this->entityManager
					->getCollectionFactory()
					->create(Holiday::ENTITY_TYPE);

				$tm->start();
				foreach ($data as $dayEntry) {
					$date = $dayEntry['date'];
					$entryMonth = $dayEntry['month'] ?? [];
					/** @var Holiday $holiday */
					$holiday = $this->entityManager->getNewEntity(Holiday::ENTITY_TYPE);
					$holiday->setMultiple([
						'id' => Util::generateId(),
						'langCode' => 'cs_CZ',
						'date' => $date,
						'holidayName' => $dayEntry['holidayName'] ?? null,
						'name' => $dayEntry['name'],
						'nominative' => $entryMonth['nominative'],
						'genitive' => $entryMonth['genitive'],
						'deleted' => false
					]);

					$mapper = $this->entityManager->getMapper();
					
					// Build update fields list - only include holidayName if it's not null
					// This preserves existing holidayName when API returns null
					$updateFields = [
						'deleted',
						'name',
						'nominative',
						'genitive',
					];
					
					if (($dayEntry['holidayName'] ?? null) !== null) {
						$updateFields[] = 'holidayName';
					}
					
					$mapper->insertOnDuplicateUpdate($holiday, $updateFields);

					if ($month === null || $holiday->getDate()->getMonth() === (int)$month) {
						$existingHolidays->append($holiday);
					}
				}
				$tm->commit();
			} catch (\Exception $e) {
				$this->log->error('Error in fetchHolidays: ' . $e->getMessage());

				$this->entityManager->getTransactionManager()->rollback();
			}
		}

		return $existingHolidays;
	}

	/**
	 * @param  WhereItem[]               $options
	 * @return EntityCollection<Holiday>
	 */
	public function fetchPublicHolidays(string $year, ?string $month = null, array $options = [], string $langCode = LangCode::cs_CZ): EntityCollection {
		$options[] = Cond::notEqual(Expr::column('holidayName'), Expr::value(null));

		return $this->fetchHolidays($year, $month, $options, $langCode);
	}

	/**
	 * @param  WhereItem[]               $options
	 * @return EntityCollection<Holiday>
	 * @internal
	 */
	protected function getHolidayCollection(string $year, ?string $month = null, array $options = [], string $langCode = LangCode::cs_CZ): EntityCollection {
		/** @var WhereItem[] $conditions */
		$conditions = [
			Cond::equal(
				Expr::year(Expr::column('date')),
				Expr::value($year)
			),
			Cond::equal(
				Expr::column('langCode'),
				Expr::value($langCode)
			)
		];

		if ($month !== null) {
			$conditions[] = Cond::equal(
				Expr::month(Expr::column('date')),
				Expr::value($month)
			);
		}

		/** @var EntityCollection<Holiday> $collection */
		$collection = $this->entityManager
			->getRDBRepository(Holiday::ENTITY_TYPE)
			->where(Cond::and(...$conditions, ...$options))
			->find();

		return $collection;
	}

	public function getHoliday(Date $date, string $langCode = LangCode::cs_CZ): Holiday {
		$dateTime = $date->toDateTime();
		$dateString = $dateTime->format('Y-m-d');
		$year = $dateTime->format('Y');
		$month = $dateTime->format('m');

		$this->fetchHolidays(year: $year, month: $month, langCode: $langCode);
		/** @var Holiday|null $holiday */
		$holiday = $this->entityManager
			->getRDBRepository(Holiday::ENTITY_TYPE)
			->where([
				'date' => $dateString,
				'langCode' => $langCode,
			])
			->findOne();

		if (!$holiday) {
			throw new \RuntimeException("Holiday not found for date: $dateString");
		}

		return $holiday;
	}

	/**
	 * Fetches an array of holiday dates for a given year.
	 * @return array<int, string>
	 */
	public function fetchHolidayDays(string $year): array {
		$holidays = $this->fetchHolidays($year);
		$holidayDays = [];

		foreach ($holidays as $holiday) {
			$holidayDays[] = $holiday->get('date');
		}

		return $holidayDays;
	}

	public static function getFormattedMonth(string $month): string {
		if (strlen($month) === 1) {
			return "0$month";
		}

		return $month;
	}

}
