<?php

namespace Espo\Modules\Viacrm\Classes\Jobs;

use Espo\Core\Job\Job;
use Espo\Core\Job\Job\Data as JobData;
use Espo\Modules\Viacrm\Core\Mail\Account\Ews\GroupAccount\Service;
use RuntimeException;
use Throwable;

/**
 * Checks EWS group email accounts (InboundEmail) for new messages.
 */
class CheckEwsInboundEmails implements Job {
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
			throw new RuntimeException("CheckEwsInboundEmails job failed, $targetId; {$e->getMessage()}", 0, $e);
		}
	}
}
