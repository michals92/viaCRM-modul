<?php

namespace Espo\Modules\Autocrm\Classes\Jobs;

use Espo\Core\Job\Job;
use Espo\Core\Job\Job\Data as JobData;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Log;
use Espo\Modules\Autocrm\Classes\Utils\Common\LangCode;
use Espo\Modules\Autocrm\Classes\Utils\HolidayUtil;
use Espo\Modules\Autocrm\Entities\Holiday;

class PreloadHolidays implements Job {

	public function __construct(
		private HolidayUtil $holidayUtil,
		private EntityManager $entityManager,
		private Log $log
	) {}

	public function run(JobData $data): void {
		$this->log->info('PreloadHolidays: Starting public holiday synchronization job');

		$currentYear = (int) date('Y');
		$yearsToPreload = $data->get('yearsToPreload') ?? 3; // Default: current + 2 future years
		$langCode = LangCode::cs_CZ; // Czech holidays only

		$this->log->info("PreloadHolidays: Configuration - Years to preload: $yearsToPreload");

		$totalHolidaysProcessed = 0;
		$totalUpdated = 0;
		$totalCreated = 0;
		$errorCount = 0;

		// First ensure base data exists from svatkyapi.cz (lazy loading)
		for ($i = 0; $i <= $yearsToPreload; $i++) {
			$year = $currentYear + $i;
			
			try {
				$this->log->info("PreloadHolidays: Ensuring base data exists for year $year");
				$this->holidayUtil->fetchHolidays((string) $year, null, [], $langCode);
			} catch (\Exception $e) {
				$this->log->error("PreloadHolidays: Failed to fetch base data for $year: " . $e->getMessage());
			}
		}

		// Now fetch and sync official public holidays from Nager.Date API
		for ($i = 0; $i <= $yearsToPreload; $i++) {
			$year = $currentYear + $i;
			
			try {
				$this->log->info("PreloadHolidays: Fetching official public holidays for year $year from Nager.Date API");
				
				$url = "https://date.nager.at/api/v3/PublicHolidays/$year/CZ";
				$json = @file_get_contents($url);
				
				if ($json === false) {
					throw new \RuntimeException('Failed to fetch holiday data from: ' . $url);
				}
				
				$publicHolidays = Json::decode($json, true);
				$this->log->info('PreloadHolidays: Received ' . count($publicHolidays) . " public holidays for $year");
				
				foreach ($publicHolidays as $publicHoliday) {
					$totalHolidaysProcessed++;
					
					$date = $publicHoliday['date'];
					$localName = $publicHoliday['localName'];
					
					$this->log->info("PreloadHolidays: Processing holiday - Date: $date, Name: $localName");
					
					// Check if record exists for this date
					$existingHoliday = $this->entityManager
						->getRDBRepository(Holiday::ENTITY_TYPE)
						->where([
							'date' => $date,
							'langCode' => $langCode,
						])
						->findOne();
					
					if ($existingHoliday) {
						// Update existing record if holidayName is missing or different
						$currentHolidayName = $existingHoliday->get('holidayName');
						
						if ($currentHolidayName !== $localName) {
							$this->log->info("PreloadHolidays: Updating holiday record for $date - Old: '$currentHolidayName', New: '$localName'");
							
							$existingHoliday->set('holidayName', $localName);
							$this->entityManager->saveEntity($existingHoliday);
							$totalUpdated++;
						} else {
							$this->log->info("PreloadHolidays: Holiday record for $date already correct");
						}
					} else {
						// Create new holiday record
						$this->log->info("PreloadHolidays: Creating new holiday record for $date");
						
						$dateObj = new \DateTime($date);
						$monthNum = $dateObj->format('n');
						
						// Get Czech month names from existing records or use defaults
						$monthNames = $this->getMonthNames($year, (int) $monthNum, $langCode);
						
						$newHoliday = $this->entityManager->getNewEntity(Holiday::ENTITY_TYPE);
						$newHoliday->setMultiple([
							'langCode' => $langCode,
							'date' => $date,
							'holidayName' => $localName,
							'name' => $localName, // Use holiday name as name too
							'nominative' => $monthNames['nominative'],
							'genitive' => $monthNames['genitive'],
						]);
						
						$this->entityManager->saveEntity($newHoliday);
						$totalCreated++;
					}
				}
				
				$this->log->info("PreloadHolidays: Successfully synchronized public holidays for year $year");
			} catch (\Exception $e) {
				$this->log->error("PreloadHolidays: Failed to sync public holidays for $year: " . $e->getMessage());
				$this->log->error('PreloadHolidays: Exception trace: ' . $e->getTraceAsString());
				$errorCount++;
			}
		}

		$this->log->info('PreloadHolidays: Job completed');
		$this->log->info("PreloadHolidays: Total holidays processed: $totalHolidaysProcessed");
		$this->log->info("PreloadHolidays: Updated: $totalUpdated, Created: $totalCreated, Errors: $errorCount");
	}

	/**
	 * @return array<string, string>
	 */
	private function getMonthNames(int $year, int $month, string $langCode): array {
		// Try to get month names from existing records
		$existingRecord = $this->entityManager
			->getRDBRepository(Holiday::ENTITY_TYPE)
			->where([
				'langCode' => $langCode,
				'MONTH(date)' => $month,
				'YEAR(date)' => $year,
				'nominative!=' => null,
			])
			->findOne();
		
		if ($existingRecord) {
			return [
				'nominative' => $existingRecord->get('nominative'),
				'genitive' => $existingRecord->get('genitive'),
			];
		}
		
		// Fallback to Czech month names
		$czechMonths = [
			1 => ['nominative' => 'leden', 'genitive' => 'ledna'],
			2 => ['nominative' => 'únor', 'genitive' => 'února'],
			3 => ['nominative' => 'březen', 'genitive' => 'března'],
			4 => ['nominative' => 'duben', 'genitive' => 'dubna'],
			5 => ['nominative' => 'květen', 'genitive' => 'května'],
			6 => ['nominative' => 'červen', 'genitive' => 'června'],
			7 => ['nominative' => 'červenec', 'genitive' => 'července'],
			8 => ['nominative' => 'srpen', 'genitive' => 'srpna'],
			9 => ['nominative' => 'září', 'genitive' => 'září'],
			10 => ['nominative' => 'říjen', 'genitive' => 'října'],
			11 => ['nominative' => 'listopad', 'genitive' => 'listopadu'],
			12 => ['nominative' => 'prosinec', 'genitive' => 'prosince'],
		];
		
		return $czechMonths[$month] ?? ['nominative' => '', 'genitive' => ''];
	}

}