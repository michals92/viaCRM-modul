<?php

namespace Espo\Modules\Viacrm\Core\Console\Commands;

use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\Exceptions\Error;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Throwable;

use const FILTER_VALIDATE_URL;
use const STDOUT;

/**
 *  This class is extended from the base to return an error exit code on failure. This is fixed in newer Espo versions, but we need to backport it to older ones.
 **/
class Upgrade extends \Espo\Core\Console\Commands\Upgrade
{
	/**
	 * @throws Error
	 */
	public function run(Params $params, IO $io): void
	{
		$options = $params->getOptions();
		$flagList = $params->getFlagList();
		$argumentList = $params->getArgumentList();

		$upgradeParams = ReflectionUtil::callClassMethod(parent::class, $this, 'normalizeParams', $options, $flagList, $argumentList);

		$fromVersion = ReflectionUtil::getClassProperty(parent::class, $this, 'config')->get('version');
		$toVersion = $upgradeParams->toVersion ?? null;

		$versionInfo = ReflectionUtil::callClassMethod(parent::class, $this, 'getVersionInfo', $toVersion);

		$nextVersion = $versionInfo->nextVersion ?? null;
		$lastVersion = $versionInfo->lastVersion ?? null;

		$packageFile = ReflectionUtil::callClassMethod(parent::class, $this, 'getPackageFile', $upgradeParams, $versionInfo);

		if (!$packageFile) {
			return;
		}

		if ($upgradeParams->localMode) {
			$upgradeId = ReflectionUtil::callClassMethod(parent::class, $this, 'upload', $packageFile);

			$manifest = ReflectionUtil::callClassMethod(parent::class, $this, 'getUpgradeManager')->getManifestById($upgradeId);

			$nextVersion = $manifest['version'];
		}

		fwrite(STDOUT, "Current version is $fromVersion.\n");

		if (!$upgradeParams->skipConfirmation) {
			fwrite(STDOUT, "EspoCRM will be upgraded to version $nextVersion now. Enter [Y] to continue.\n");

			if (!ReflectionUtil::callClassMethod(parent::class, $this, 'confirm')) {
				echo "Upgrade canceled.\n";

				return;
			}
		}

		fwrite(STDOUT, "This may take a while. Do not close the terminal.\n");

		if (filter_var($packageFile, FILTER_VALIDATE_URL)) {
			fwrite(STDOUT, 'Downloading...');

			$packageFile = ReflectionUtil::callClassMethod(parent::class, $this, 'downloadFile', $packageFile);

			fwrite(STDOUT, "\n");

			if (!$packageFile) {
				fwrite(STDOUT, "Error: Unable to download upgrade package.\n");

				$io->setExitStatus(1);

				return;
			}
		}

		$upgradeId = $upgradeId ?? ReflectionUtil::callClassMethod(parent::class, $this, 'upload', $packageFile);

		fwrite(STDOUT, 'Upgrading...');

		try {
			ReflectionUtil::callClassMethod(parent::class, $this, 'runUpgradeProcess', $upgradeId, $upgradeParams);
		} catch (Throwable $e) {
			ReflectionUtil::callClassMethod(parent::class, $this, 'displayStep', 'revert');
			$errorMessage = $e->getMessage();
		}

		fwrite(STDOUT, "\n");

		if (!$upgradeParams->keepPackageFile) {
			ReflectionUtil::getClassProperty(parent::class, $this, 'fileManager')->unlink($packageFile);
		}

		if (isset($errorMessage)) {
			$errorMessage = !empty($errorMessage) ? $errorMessage : 'Error: An unexpected error occurred.';

			fwrite(STDOUT, $errorMessage . "\n");
			$io->setExitStatus(1);

			return;
		}

		$currentVersion = ReflectionUtil::callClassMethod(parent::class, $this, 'getCurrentVersion');

		fwrite(STDOUT, "Upgrade is complete. Current version is $currentVersion.\n");

		if ($lastVersion && $lastVersion !== $currentVersion && $fromVersion !== $currentVersion) {
			fwrite(STDOUT, "Newer version is available. Run command again to upgrade.\n");

			return;
		}

		if ($lastVersion && $lastVersion === $currentVersion) {
			fwrite(STDOUT, "You have the latest version.\n");
		}
	}
}
