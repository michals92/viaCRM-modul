<?php

namespace Espo\Modules\Viacrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Metadata;

class MetadataGet implements Command
{
	public function __construct(
		private readonly Metadata $metadata
	) {
	}

	public function run(Params $params, IO $io): void
	{
		$path = $params->getArgument(0);

		if (!$path) {
			$io->writeLine('Usage: php command.php metadata-get <path>');
			$io->writeLine('Example: php command.php metadata-get entityDefs.Contact.fields');
			$io->writeLine('Example: php command.php metadata-get clientDefs.Task.additionalLayouts');
			$io->setExitStatus(1);

			return;
		}

		// Convert dot notation to array path
		$pathArray = explode('.', $path);

		// Get value using metadata get method
		$value = $this->metadata->get($pathArray);

		// Output value as JSON
		$json = Json::encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

		$io->writeLine($json);

		// Set exit status based on whether key was found
		if ($value === null) {
			$io->setExitStatus(1);
		}
	}
}
