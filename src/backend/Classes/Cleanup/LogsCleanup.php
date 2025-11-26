<?php

namespace Espo\Modules\Viacrm\Classes\Cleanup;

use Espo\Core\Cleanup\Cleanup;
use Espo\Core\Field\DateTime;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\File\Manager as FileManager;
use SplFileInfo;

class LogsCleanup implements Cleanup
{
	private const PERIOD = '30 days';
	private const LOG_DIR = 'data/logs';

	public function __construct(
		private Config $config,
		private FileManager $fileManager
	) {
	}

	public function process(): void
	{
		if (!$this->config->get('cleanupDataLogs')) {
			return;
		}

		$beforeDate = $this->getBefore();
		$logDir = self::LOG_DIR;

		if (!$this->fileManager->isDir($logDir)) {
			return;
		}

		/** @var string[] $fileList */
		$fileList = $this->fileManager->getFileList($logDir, false, '', false);

		foreach ($fileList as $file) {
			$filePath = $logDir . '/' . $file;

			if (!$this->fileManager->isFile($filePath)) {
				continue;
			}

			if (!preg_match('/\.log$/', $file)) {
				continue;
			}

			$info = new SplFileInfo($filePath);
			$fileTime = $info->getMTime();

			$fileDateTime = DateTime::fromTimestamp($fileTime);

			if ($fileDateTime->isLessThan($beforeDate)) {
				$this->fileManager->removeFile($filePath);
			}
		}
	}

	private function getBefore(): DateTime
	{
		/** @var string $period */
		$period = $this->config->get('cleanupDataLogsPeriod') ?? self::PERIOD;

		return DateTime::createNow()->modify('-' . $period);
	}
}
