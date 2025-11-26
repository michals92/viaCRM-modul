<?php

use Espo\Core\Container;
use Espo\Core\DataManager;
use Espo\Core\InjectableFactory;
use Espo\Core\Upgrades\ActionManager;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Config\ConfigWriter;
use Espo\Entities\Extension;
use Espo\Entities\ExternalAccount;
use Espo\Entities\Role;
use Espo\Modules\Viacrm\Entities\Alert;
use Espo\Modules\Viacrm\Entities\Holiday;
use Espo\ORM\EntityCollection;
use Espo\ORM\EntityManager;

class AfterInstall {
	private const ID_PREFIX = '35';

	private const TAB_LIST_ENTITIES = [
		[
			'type' => 'group',
			'text' => 'Product Management',
			'iconClass' => 'fas fa-cube',
			'color' => null,
			'id' => self::ID_PREFIX . '0001',
			'itemList' => [
				'Product', 'ProductCategory', 'ProductSerial', 'ProductSupplierItem', 'Ean', 'TaxClass',
			],
		],
	];

	protected const DEPRECATED_EXTENSIONS = [
		'RecurringRecords'
	];

	private const DEFAULT_CONFIG = [
		'addressCountryList' => [
			'CZ',
			'PL',
			'SK',
			'DE'
		],
		'adminNotificationsExtensionLicenseDisabled' => true,
		'adminPanelIframeUrl' => 'https://espocrm.trt.ls',
		'aresEnabled' => true,
		'aresIncludeHouseNumbersInAddress' => true,
		'currencyRateDecimalSeparator' => ',',
		'customPrefixDisabled' => true,
		'disableExtensionLicenseMessage' => true,
		'disableAccountLinkToEmail' => true,
		'disableAccountLinkToPhone' => true,

		'editEntityEnabled' => true,
		'editLayoutEnabled' => true,
		'editFiltersEnabled' => true,
		'editLabelsEnabled' => false,
		'editNavbarEnabled' => true,
		'viewApiEnabled' => true,

		'emailCheckInterval' => 60,
		'finstatEnabled' => false,
		'refreshEntityEnabled' => true,
		'sanitizerAllowedUrlSchemes' => ['notes'],
		'stickyHeader' => true,
		'stickyPdfView' => false,
		'streamRecordsPerPage' => 5,
		'tokenZiveFirmy' => 'eyJhbGciOiJIUzI1NiJ9.YXBlcnRpYQ.zKAFSmT6F_h05zrVZRPMWmTF20IWu2VDjs9LeiunYvo', // This is fine :)
		'webSocketPingTimeout' => 20,
		'weightUnitList' => [
			't',
			'kg',
			'g',
			'dg',
			'mg'
		],
		'timeUnitList' => [
			'h',
			'min',
			's',
			'ms'
		],
		'lengthUnitList' => [
			'km',
			'm',
			'dm',
			'cm',
			'mm'
		],
		'areaUnitList' => [
			'km²',
			'ha',
			'a',
			'm²',
			'dm²',
			'cm²',
			'mm²'
		],
		'volumeUnitList' => [
			'mm³',
			'm³',
			'l',
			'ml'
		],
		'quantityUnitList' => [
			'ks',
			'bal',
			'set',
			'kpl',
		],
		'currentUnitList' => [
			'A',
			'mA',
			'µA',
			'nA',
			'pA',
		],
		'powerUnitList' => [
			'MW',
			'kW',
			'W',
		],
		'energyUnitList' => [
			'MWh',
			'kWh',
			'MJ',
			'kJ',
			'J',
		],
		'voltageUnitList' => [
			'kV',
			'V',
			'mV',
			'µV',
			'nV',
			'pV',
		],
		'addressCountryListOptions' => [
			'AF',
			'AX',
			'AL',
			'DZ',
			'AS',
			'AD',
			'AO',
			'AI',
			'AQ',
			'AG',
			'AR',
			'AM',
			'AW',
			'AU',
			'AT',
			'AZ',
			'BS',
			'BH',
			'BD',
			'BB',
			'BY',
			'BE',
			'BZ',
			'BJ',
			'BM',
			'BT',
			'BO',
			'BA',
			'BW',
			'BV',
			'BR',
			'IO',
			'BN',
			'BG',
			'BF',
			'BI',
			'KH',
			'CM',
			'CA',
			'CV',
			'KY',
			'CF',
			'TD',
			'CL',
			'CN',
			'CX',
			'CC',
			'CO',
			'KM',
			'CG',
			'CD',
			'CK',
			'CR',
			'CI',
			'HR',
			'CU',
			'CY',
			'CZ',
			'DK',
			'DJ',
			'DM',
			'DO',
			'EC',
			'EG',
			'SV',
			'GQ',
			'ER',
			'EE',
			'ET',
			'FK',
			'FO',
			'FJ',
			'FI',
			'FR',
			'GF',
			'PF',
			'TF',
			'GA',
			'GM',
			'GE',
			'DE',
			'GH',
			'GI',
			'GR',
			'GL',
			'GD',
			'GP',
			'GU',
			'GT',
			'GG',
			'GN',
			'GW',
			'GY',
			'HT',
			'HM',
			'VA',
			'HN',
			'HK',
			'HU',
			'IS',
			'IN',
			'ID',
			'IR',
			'IQ',
			'IE',
			'IM',
			'IL',
			'IT',
			'JM',
			'JP',
			'JE',
			'JO',
			'KZ',
			'KE',
			'KI',
			'KR',
			'KP',
			'KW',
			'KG',
			'LA',
			'LV',
			'LB',
			'LS',
			'LR',
			'LY',
			'LI',
			'LT',
			'LU',
			'MO',
			'MK',
			'MG',
			'MW',
			'MY',
			'MV',
			'ML',
			'MT',
			'MH',
			'MQ',
			'MR',
			'MU',
			'YT',
			'MX',
			'FM',
			'MD',
			'MC',
			'MN',
			'ME',
			'MS',
			'MA',
			'MZ',
			'MM',
			'NA',
			'NR',
			'NP',
			'NL',
			'AN',
			'NC',
			'NZ',
			'NI',
			'NE',
			'NG',
			'NU',
			'NF',
			'MP',
			'NO',
			'OM',
			'PK',
			'PW',
			'PS',
			'PA',
			'PG',
			'PY',
			'PE',
			'PH',
			'PN',
			'PL',
			'PT',
			'PR',
			'QA',
			'RE',
			'RO',
			'RU',
			'RW',
			'BL',
			'SH',
			'KN',
			'LC',
			'MF',
			'PM',
			'VC',
			'WS',
			'SM',
			'ST',
			'SA',
			'SN',
			'RS',
			'SC',
			'SL',
			'SG',
			'SK',
			'SI',
			'SB',
			'SO',
			'ZA',
			'GS',
			'ES',
			'LK',
			'SD',
			'SR',
			'SJ',
			'SZ',
			'SE',
			'CH',
			'SY',
			'TW',
			'TJ',
			'TZ',
			'TH',
			'TL',
			'TG',
			'TK',
			'TO',
			'TT',
			'TN',
			'TR',
			'TM',
			'TC',
			'TV',
			'UG',
			'UA',
			'AE',
			'GB',
			'US',
			'UM',
			'UY',
			'UZ',
			'VU',
			'VE',
			'VN',
			'VG',
			'VI',
			'WF',
			'EH',
			'YE',
			'ZM',
			'ZW',
		],
	];

	private Config $config;

	private ConfigWriter $configWriter;

	private DataManager $dataManager;

	private EntityManager $entityManager;
	protected InjectableFactory $injectableFactory;

	/**
	 * @param  array<string, mixed>                      $params
	 * @throws \Psr\Container\NotFoundExceptionInterface
	 * @throws \Espo\Core\Exceptions\Error
	 */
	public function run(Container $container, array $params = []): void {
		$this->loadDependencies($container);

		if (empty($params['isUpgrade'])) {
			$this->addEntitiesToTabList();
		}
		$this->uninstallDeprecatedExtensions();
		$this->defaultConfig();

		$this->fixRolePrintPermissions();
		$this->fixExternalAccountGoogleSync();
		$this->moveCleanupConfigToAdmin();
		$this->fixAllEmailFolderPermissions();

		$this->checkLaborDayHolidays();

		$this->clearCache();
		$this->restartWSS();
	}

	/**
	 * @throws \Espo\Core\Exceptions\Error
	 */
	protected function uninstallDeprecatedExtensions(): void {
		/** @var ActionManager $actionManager */
		$actionManager = $this->injectableFactory->createWith(ActionManager::class, [
			'managerName' => 'Extension',
			'params' => [
				'scriptNames' => []
			]
		]);
		$actionManager->setAction('Uninstall');

		foreach (self::DEPRECATED_EXTENSIONS as $deprecatedExtensionName) {
			$extension = $this->entityManager
				->getRDBRepository(Extension::ENTITY_TYPE)
				->where([
					'name' => $deprecatedExtensionName,
					'isInstalled' => true,
				])
				->findOne();

			if ($extension) {
				$message = 'Uninstalling deprecated extension: ' . $deprecatedExtensionName;
				$GLOBALS['log']->info($message);
				echo $message;
				$actionManager->run(['id' => $extension->getId()]);
				echo $deprecatedExtensionName . ' extension uninstalled.';
			}
		}
	}

	private function restartWSS(): void {
		$output = [];
		$exitCode = 0;
		exec('crmws restart 2>&1', $output, $exitCode);

		if ($exitCode === 0) {
			echo "[$exitCode] Websockets restarted by ViaCRM: " . implode("\n", $output) . "\n";
			$GLOBALS['log']->notice("[$exitCode] Websockets restarted by ViaCRM: " . implode("\n", $output) . "\n");
		} else {
			echo "[$exitCode] Failed to restart websockets by ViaCRM:\n" . implode("\n", $output) . "\n";
			$GLOBALS['log']->error("[$exitCode] Failed to restart websockets by ViaCRM. Output:" . implode("\n", $output) . "\n");
		}
	}

	/**
	 * @throws \Psr\Container\NotFoundExceptionInterface
	 */
	private function loadDependencies(Container $container): void {
		$injectableFactory = $container->getByClass(InjectableFactory::class);

		$this->config = $container->getByClass(Config::class);
		$this->configWriter = $injectableFactory->create(ConfigWriter::class);
		$this->dataManager = $container->getByClass(DataManager::class);
		$this->entityManager = $container->getByClass(EntityManager::class);
		$this->injectableFactory = $container->getByClass(InjectableFactory::class);
	}

	private function defaultConfig(): void {
		foreach (self::DEFAULT_CONFIG as $key => $value) {
			if (is_array($value)) {
				if (!$this->config->has($key) || empty($this->config->get($key))) {
					$this->configWriter->set($key, $value);
				}
			} else {
				if (!$this->config->has($key)) {
					$this->configWriter->set($key, $value);
				}
			}
		}

		$loggerData = $this->config->get('logger', []);

		$loggerData['printTrace'] = true;
		$loggerData['sqlFailed'] = true;

		// We do this so that we can our custom formatter that doesn't skip the context
		$loggerData['handlerList'] = [
			[
				'loaderClassName' => 'Espo\\Core\\Log\\EspoRotatingFileHandlerLoader',
				'level' => 'NOTICE',
				'formatter' => [
					'className' => 'Espo\\Modules\\Viacrm\\Core\\Log\\ViacrmFormatter',
				]
			]
		];

		$this->configWriter->set('logger', $loggerData);

		$this->configWriter->save();
	}

	private function fixRolePrintPermissions(): void {
		/** @var EntityCollection<Role> $roles */
		$roles = $this
			->entityManager
			->getRDBRepository(Role::ENTITY_TYPE)
			->find();

		foreach ($roles as $role) {
			$rawData = $role->get('data') ?? (object)[];

			foreach ($rawData as $scope => $scopeData) {
				if ($scopeData instanceof stdClass) {
					if (!property_exists($scopeData, 'print') || is_null($scopeData->print)) {
						$scopeData->print = $scopeData->read;

						$rawData->$scope = $scopeData;
					}
				}
			}

			$role->set('data', $rawData);

			$this->entityManager->saveEntity($role);
		}
	}

	private function fixExternalAccountGoogleSync(): void {
		$entitiesToRemove = [Alert::ENTITY_TYPE];

		/** @var EntityCollection<ExternalAccount> $externalAccounts */
		$externalAccounts = $this
			->entityManager
			->getRDBRepository(ExternalAccount::ENTITY_TYPE)
			->where('id*', 'Google__%')
			->find();

		foreach ($externalAccounts as $externalAccount) {
			$calendarEntityTypes = $externalAccount->get('calendarEntityTypes');

			if (is_array($calendarEntityTypes)) {
				$newCalendarEntityTypes = [];

				foreach ($calendarEntityTypes as $calendarEntityType) {
					if (!in_array($calendarEntityType, $entitiesToRemove)) {
						$newCalendarEntityTypes[] = $calendarEntityType;
					}
				}

				$externalAccount->set('calendarEntityTypes', $newCalendarEntityTypes);
			}

			$this->entityManager->saveEntity($externalAccount);
		}
	}

	private function addEntitiesToTabList(): void {
		$tabList = $this->config->get('tabList') ?? [];

		foreach (self::TAB_LIST_ENTITIES as $item) {
			// Handle group objects (product management)
			if (is_array($item) && isset($item['type']) && $item['type'] === 'group') {
				$existingIndex = $this->findExistingGroupIndex($tabList, $item['id']);

				if ($existingIndex !== -1) {
					// Update existing group
					$tabList[$existingIndex] = $this->mergeGroupProperties(
						$tabList[$existingIndex],
						$item
					);
				} else {
					// Add new group
					$tabList[] = (object) $item;
				}
			}
			// Handle simple entity strings
			elseif (is_string($item)) {
				if (!in_array($item, $tabList, true)) {
					$tabList[] = $item;
				}
			}
		}

		$this->configWriter->set('tabList', $tabList);
		$this->configWriter->save();
	}

	private function clearCache(): void {
		try {
			$this->dataManager->clearCache();
		} catch (\Exception) {
		}
	}

	/**
	 * Moves cleanup parameters from systemItems to adminItems to make them configurable in UI.
	 *
	 * We need to do a config dance here because these parameters might already be saved
	 * in config-internal.php (since they were originally in systemItems). Parameters in
	 * config-internal.php are filtered out by getAllNonInternalData() and never sent to
	 * the frontend.
	 *
	 * The trick is to:
	 * 1. Save current values
	 * 2. Remove them from config (clears from config-internal.php)
	 * 3. Update systemItems/adminItems arrays
	 * 4. Restore the values (now they'll be saved to regular config.php)
	 */
	private function moveCleanupConfigToAdmin(): void {
		// Parameters to move from system to admin
		$paramsToMove = ['cleanupAppLog', 'cleanupAppLogPeriod'];

		// Save current values (might be in config-internal.php)
		$savedValues = [];
		foreach ($paramsToMove as $param) {
			if ($this->config->has($param)) {
				$savedValues[$param] = $this->config->get($param);
			}
		}

		// Clear these values from config to ensure they're not in internal
		foreach ($paramsToMove as $param) {
			$this->configWriter->remove($param);
		}
		$this->configWriter->save();

		// Get current config arrays
		$systemItems = $this->config->get('systemItems', []);
		$adminItems = $this->config->get('adminItems', []);

		// Remove from systemItems
		$systemItems = array_values(array_diff($systemItems, $paramsToMove));

		// Add to adminItems if not already there
		foreach ($paramsToMove as $param) {
			if (!in_array($param, $adminItems)) {
				$adminItems[] = $param;
			}
		}

		// Save the updated arrays
		$this->configWriter->set('systemItems', $systemItems);
		$this->configWriter->set('adminItems', $adminItems);
		$this->configWriter->save();

		// Now restore the saved values - they should go to regular config
		foreach ($savedValues as $param => $value) {
			$this->configWriter->set($param, $value);
		}
		$this->configWriter->save();
	}

	/**
	 * Updates existing roles to set allEmailFolderPermission to "yes" if it's currently "not-set"
	 * This ensures backward compatibility while making the permission allowed by default
	 */
	private function fixAllEmailFolderPermissions(): void {
		/** @var EntityCollection<Role> $roles */
		$roles = $this
			->entityManager
			->getRDBRepository(Role::ENTITY_TYPE)
			->where([
				'allEmailFolderPermission' => 'not-set'
			])
			->find();

		foreach ($roles as $role) {
			$role->set('allEmailFolderPermission', 'yes');
			$this->entityManager->saveEntity($role);
		}

		// Log the update
		$count = count($roles);
		if ($count > 0) {
			$message = "Updated $count role(s) to allow allEmailFolderPermission by default.";
			$GLOBALS['log']->info($message);
			echo $message . "\n";
		}
	}

	/**
	 * Check if Labor Day (May 1st) is correctly marked as a holiday for the next two years.
	 * If not, run the PreloadHolidays job to sync holiday data.
	 */
	private function checkLaborDayHolidays(): void {
		$currentYear = (int) date('Y');
		$laborDayMissingCount = 0;
		$checkedYears = [];

		$GLOBALS['log']->info('AfterInstall: Starting Labor Day holiday check for years ' . ($currentYear + 1) . '-' . ($currentYear + 2));

		// Check next two years
		for ($year = $currentYear + 1; $year <= $currentYear + 2; $year++) {
			$laborDayDate = "$year-05-01";
			$checkedYears[] = $year;

			/** @var Holiday|null $holiday */
			$holiday = $this->entityManager
				->getRDBRepository(Holiday::ENTITY_TYPE)
				->where([
					'date' => $laborDayDate,
					'deleted' => false,
				])
				->findOne();

			if (!$holiday) {
				$laborDayMissingCount++;
				$GLOBALS['log']->warning("AfterInstall: Labor Day ($laborDayDate) - NO RECORD FOUND in database");
				continue;
			}

			// Check if holiday exists and is properly marked
			$holidayName = $holiday->get('holidayName');
			$isLaborDayCorrect = $holidayName !== null && $holidayName !== '';

			if (!$isLaborDayCorrect) {
				$laborDayMissingCount++;
				$GLOBALS['log']->warning("AfterInstall: Labor Day ($laborDayDate) - INCORRECTLY MARKED (holidayName is null/empty)");
			}
		}

		$GLOBALS['log']->info('AfterInstall: Labor Day check completed. Years checked: ' . implode(', ', $checkedYears) . '. Missing/incorrect holidays: ' . $laborDayMissingCount);

		// If any Labor Day is missing, run PreloadHolidays job
		if ($laborDayMissingCount > 0) {
			$GLOBALS['log']->info("AfterInstall: Found $laborDayMissingCount missing Labor Day holidays. Running PreloadHolidays job to sync data.");
			$this->runPreloadHolidaysJob();
		} else {
			$GLOBALS['log']->info('AfterInstall: All Labor Day holidays are correctly configured for the next two years.');
		}
	}

	/**
	 * Run the PreloadHolidays job using console command
	 */
	private function runPreloadHolidaysJob(): void {
		$GLOBALS['log']->info('AfterInstall: Starting PreloadHolidays job execution using console command');

		try {
			// Execute the console command
			$output = [];
			$exitCode = 0;
			$currentDir = getcwd();
			
			if ($currentDir === false) {
				$GLOBALS['log']->error('AfterInstall: Failed to get current working directory');

				return;
			}
			
			$command = 'cd ' . escapeshellarg($currentDir) . ' && php command.php run-job PreloadHolidays 2>&1';
			
			exec($command, $output, $exitCode);

			if ($exitCode === 0) {
				$GLOBALS['log']->info('AfterInstall: PreloadHolidays job executed successfully via console command.');
			} else {
				$outputString = implode("\n", $output);
				$GLOBALS['log']->error("AfterInstall: PreloadHolidays command failed with exit code $exitCode. Output: " . $outputString);
			}
		} catch (Exception $e) {
			$GLOBALS['log']->error('AfterInstall: Failed to run PreloadHolidays command. Error: ' . $e->getMessage());
		}
	}

	/**
	 * @param array<int, object> $tabList
	 */
	private function findExistingGroupIndex(array $tabList, string $groupId): int {
		foreach ($tabList as $index => $item) {
			if (isset($item->type, $item->id) &&
				$item->type === 'group' &&
				$item->id === $groupId) {
				return $index;
			}
		}

		return -1;
	}

	/**
	 * @param array<string, mixed> $desired
	 */
	private function mergeGroupProperties(object $existing, array $desired): object {
		$merged = clone $existing;

		// Update missing/null properties
		foreach (['text', 'iconClass', 'color'] as $prop) {
			if (!property_exists($merged, $prop) || $merged->$prop === null) {
				/** @phpstan-ignore-next-line */
				$merged->$prop = $desired[$prop] ?? null;
			}
		}

		// Merge itemList - add missing entities
		$existingItems = property_exists($merged, 'itemList') ? $merged->itemList : [];
		$missingItems = array_diff($desired['itemList'], $existingItems);
		/** @phpstan-ignore-next-line */
		$merged->itemList = array_merge($existingItems, $missingItems);

		return $merged;
	}
}
