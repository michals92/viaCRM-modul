<?php

namespace Espo\Modules\Autocrm\Classes\TemplateHelpers;

use Espo\Core\Htmlizer\Helper;
use Espo\Core\Htmlizer\Helper\Data;
use Espo\Core\Htmlizer\Helper\Result;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Language;
use Espo\Modules\Crm\Entities\Call;
use Espo\Modules\Crm\Entities\Meeting;
use Exception;

class Calendar implements Helper {

	private const STYLE_CALENDAR = 'display: flex;font-family: Arial, Helvetica, sans-serif; text-align: center;';
	private const STYLE_LINK = 'text-decoration: none; color: dimgray; padding: 0.5em 0.7em; font-weight: bold; border: 1px solid lightgrey; background: white; margin: 2px; border-radius: 2px; width: 120px;';

	private const GOOGLE = 'google';
	private const OUTLOOK = 'outlook';

	private string $name;

	private string $description;

	private \DateTime $dateStart;

	private \DateTime $dateEnd;

	public function __construct(
		private readonly Config $config,
		private readonly Language $language
	) {}

	private function setUTC(\DateTime ...$dts): void {
		foreach ($dts as $dt) {
			$dt->setTimezone(new \DateTimeZone('UTC'));
		}
	}

	private function outlookCal(): string {
		$dateFormat = 'Y-m-d\TH:i:s\Z';

		$url = 'https://outlook.live.com/calendar/0/deeplink/compose?' .
		    http_build_query([
		        'rru' => 'addevent',
		        'path' => '/calendar/action/compose',
		        'subject' => $this->name,
		        'body' => $this->description,
		        'startdt' => $this->dateStart->format($dateFormat),
		        'enddt' => $this->dateEnd->format($dateFormat),
		        'allday' => 'false',
		    ]);

		$label = $this->language->translateLabel('Outlook Calendar');

		$style = self::STYLE_LINK . 'border-bottom: 2px solid #00A4EF;';

		return <<<HTML
            <a style='$style' rel='noopener' href='$url'>
                $label
            </a>
        HTML;
	}

	private function googleCal(): string {
		$dateFormat = 'Ymd\THis\Z';

		$url = 'https://calendar.google.com/calendar/event?' .
		    http_build_query([
		        'action' => 'TEMPLATE',
		        'text' => $this->name,
		        'details' => $this->description,
		        'dates' => $this->dateStart->format($dateFormat) . '/' . $this->dateEnd->format($dateFormat)
		    ]);

		$label = $this->language->translateLabel('Google Calendar');

		$style = self::STYLE_LINK . 'border-bottom: 2px solid #7FBA00;';

		return <<<HTML
            <a style='$style' rel='noopener' href='$url'>
                $label
            </a>
        HTML;
	}

	public function render(Data $data): Result {
		try {
			$rootContext = $data->getRootContext();
			$entityType = $rootContext['__entityType'] ?? '';

			if (!in_array($entityType, [Meeting::ENTITY_TYPE, Call::ENTITY_TYPE])) {
				throw new Exception('Entity not supported');
			}

			$timeZone = $this->config->get('timeZone') ?: 'UTC';

			$this->name = $rootContext['name'] ?? '';
			$this->description = $rootContext['description'] ?? '';
			$this->dateStart = new \DateTime($rootContext['dateStart'], new \DateTimeZone($timeZone));
			$this->dateEnd = new \DateTime($rootContext['dateEnd'], new \DateTimeZone($timeZone));
			$this->setUTC($this->dateStart, $this->dateEnd);

			$providers = $data->getOption('providers') ?? '';

			if (empty($providers)) {
				throw new Exception('Providers not specified');
			} else {
				$providers = array_unique(explode(',', $providers));

				foreach ($providers as &$provider) {
					$provider = match ($provider) {
						self::GOOGLE => $this->googleCal(),
						self::OUTLOOK => $this->outlookCal(),
						default => '',
					};
				}

				$providers = array_filter($providers, fn($provider) => !empty($provider));

				if (empty($providers)) {
					throw new Exception('Providers are invalid/not supported');
				}
			}

			return Result::createSafeString(
				'<div style="' . self::STYLE_CALENDAR . '">'
				    . implode('', $providers) .
				'</div>'
			);
		} catch (Exception $e) {
			$GLOBALS['log']->error('Calendar template helper error:' . $e->getMessage());

			return Result::createEmpty();
		}
	}

}
