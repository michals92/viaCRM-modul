<?php

namespace Espo\Modules\Viacrm\Core\Job;

use Espo\Core\Job\Job\Status;
use Espo\Entities\Job as JobEntity;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use LogicException;
use RuntimeException;
use Throwable;

/**
 * This class is here so that errors are logged with the full stack trace.
 */
class JobRunner extends \Espo\Core\Job\JobRunner
{
	/**
	 * Run a job entity. Does not throw exceptions.
	 */
	public function run(JobEntity $jobEntity): void
	{
		try {
			$this->runInternal($jobEntity);
		} catch (Throwable $e) {
			throw new LogicException($e->getMessage());
		}
	}

	/**
	 * Run a job entity. Throws exceptions.
	 *
	 * @throws Throwable
	 */
	public function runThrowingException(JobEntity $jobEntity): void
	{
		$this->runInternal($jobEntity, true);
	}

	/**
	 * @throws Throwable
	 */
	private function runInternal(JobEntity $jobEntity, bool $throwException = false): void
	{
		$isSuccess = true;
		$exception = null;

		if ($jobEntity->getStatus() !== Status::RUNNING) {
			ReflectionUtil::callClassMethod(parent::class, $this, 'setJobRunning', $jobEntity);
		}

		try {
			if ($jobEntity->getScheduledJobId()) {
				ReflectionUtil::callClassMethod(parent::class, $this, 'runScheduledJob', $jobEntity);
			} elseif ($jobEntity->getJob()) {
				ReflectionUtil::callClassMethod(parent::class, $this, 'runJobNamed', $jobEntity);
			} elseif ($jobEntity->getClassName()) {
				ReflectionUtil::callClassMethod(parent::class, $this, 'runJobWithClassName', $jobEntity);
			} elseif ($jobEntity->getServiceName()) {
				ReflectionUtil::callClassMethod(parent::class, $this, 'runService', $jobEntity);
			} else {
				$id = $jobEntity->getId();

				throw new RuntimeException("Not runnable job '$id'.");
			}
		} catch (Throwable $e) {
			$isSuccess = false;

			$jobId = $jobEntity->hasId() ? $jobEntity->getId() : null;

			ReflectionUtil::getClassProperty(parent::class, $this, 'log')->critical('Failed job {id}. {message}', [
				'exception' => $e,
				'message' => $e->getMessage(),
				'id' => $jobId,
				/** This is the addition over the original */
				'trace' => $e->getTraceAsString(),
			]);

			if ($throwException) {
				$exception = $e;
			}
		}

		$status = $isSuccess ? Status::SUCCESS : Status::FAILED;

		$jobEntity->setStatus($status);

		if ($isSuccess) {
			$jobEntity->setExecutedAtNow();
		}

		ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager')
			->saveEntity($jobEntity);

		if ($throwException && $exception) {
			throw new $exception($exception->getMessage());
		}

		if ($jobEntity->getScheduledJobId()) {
			ReflectionUtil::getClassProperty(parent::class, $this, 'scheduleUtil')->addLogRecord(
				$jobEntity->getScheduledJobId(),
				$status,
				null,
				$jobEntity->getTargetId(),
				$jobEntity->getTargetType()
			);
		}
	}
}
