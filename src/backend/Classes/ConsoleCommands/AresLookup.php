<?php

namespace Espo\Modules\Viacrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\Utils\Json;
use Espo\Modules\Viacrm\Tools\Ares\Service as AresService;
use Exception;

class AresLookup implements Command
{
	public function __construct(
		private readonly AresService $aresService
	) {
	}

	public function run(Params $params, IO $io): void
	{
		$sicCode = $params->getArgument(0);

		if (!$sicCode) {
			$io->writeLine('Usage: php command.php aresLookup <sicCode> [--raw]');
			$io->writeLine('Example: php command.php aresLookup 27117758');
			$io->writeLine('Example: php command.php aresLookup 27117758 --raw');
			$io->writeLine('');
			$io->writeLine('Options:');
			$io->writeLine('  --raw    Return raw ARES API response without processing');

			return;
		}

		$raw = $params->hasFlag('raw');

		try {
			$data = $raw
				? $this->aresService->getRawDataBySicCode($sicCode)
				: $this->aresService->getDataBySicCode($sicCode);

			// Output data as pretty JSON
			$json = Json::encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

			$io->writeLine($json);
		} catch (Exception $e) {
			$io->writeLine('Error: ' . $e->getMessage());
			$io->setExitStatus(1);
		}
	}
}
