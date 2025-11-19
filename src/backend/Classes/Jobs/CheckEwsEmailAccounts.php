<?php

namespace Espo\Modules\Autocrm\Classes\Jobs;

use Espo\Core\Job\Job;
use Espo\Core\Job\Job\Data as JobData;
use Espo\Modules\Autocrm\Core\Mail\Account\Ews\PersonalAccount\Service;
use RuntimeException;
use Throwable;

/**
 * Checks EWS personal email accounts for new messages.
 */
class CheckEwsEmailAccounts implements Job {

	public function __construct(
		private Service $service
	) {}

	public function run(JobData $data): void {
		$targetId = $data->getTargetId();

		if (!$targetId) {
			throw new RuntimeException('No target.');
		}

		try {
			$this->service->fetch($targetId);
		} catch (Throwable $e) {
			throw new RuntimeException("CheckEwsEmailAccounts job failed, $targetId; {$e->getMessage()}", 0, $e);
		}
	}

}
