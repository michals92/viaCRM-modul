<?php

namespace Espo\Modules\Viacrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\ORM\EntityManager;

class LastJobRun implements Command {

	public function __construct(
		private readonly EntityManager $entityManager
	) {}

	public function run(Params $params, IO $io): void {
		$jobName = $params->getArgument(0);

		if (!$jobName) {
			$io->writeLine('Usage: php command.php last-job-run <jobName>');
			$io->writeLine('Example: php command.php last-job-run OrderSyncJob');

			return;
		}

		// Check if the job exists in scheduled jobs
		$scheduledJob = $this->entityManager
		    ->getRDBRepository('ScheduledJob')
		    ->where(['job' => $jobName])
		    ->findOne();

		if (!$scheduledJob) {
			$io->writeLine("Job '$jobName' not found");
			$io->setExitStatus(1);

			return;
		}

		$lastRun = $scheduledJob->get('lastRun');
        
		if ($lastRun) {
			$io->writeLine($lastRun);
		} else {
			$io->writeLine('Never');
		}
	}

}