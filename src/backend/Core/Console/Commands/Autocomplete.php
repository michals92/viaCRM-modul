<?php

namespace Espo\Modules\Autocrm\Core\Console\Commands;

use Espo\Core\Console\Command\Params;
use Espo\Core\Console\CommandManager;
use Espo\Core\Console\IO;
use Espo\Core\Exceptions\Error;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\File\ClassMap;
use Espo\Core\Utils\Metadata;
use Espo\Core\Utils\Util;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Autocrm\Core\Console\CommandAutocomplete;

class Autocomplete extends \Espo\Core\Console\Commands\Upgrade {

	public function __construct(
		protected readonly CommandManager $commandManager,
		protected readonly InjectableFactory $injectableFactory,
		protected readonly Metadata $metadata,
		protected readonly ClassMap $classMap,
	) {}

	/**
	 * @throws Error
	 */
	public function run(Params $params, IO $io): void {
		// Hack so that we have the same command name extraction logic as when running php command.php or bin/command
		$command = ReflectionUtil::callMethod($this->commandManager, 'getCommandNameFromArgv', [null, ...$params->getArgumentList()]);

		if ($command) {
			/** @var class-string<CommandAutocomplete> $autocompleteClassName */
			$autocompleteClassName = $this->metadata->get(['app', 'consoleCommands', $command, 'autocompleteClassName']);

			$autocompleteObj = $this->injectableFactory->create($autocompleteClassName);

			$suggestions = $autocompleteObj->getAutocompleteSuggestions([], '');

			foreach ($suggestions as $suggestion) {
				$io->writeLine($suggestion);
			}
		} else {
			$consoleCommands = $this->metadata->get(['app', 'consoleCommands'], []);

			/** @var string[] $metadataCommands */
			$metadataCommands = array_keys($consoleCommands);

			/** @var string[] $commandsByPath */
			$commandsByPath = array_keys($this->classMap->getData('Core/Console/Commands'));

			$commands = array_merge($metadataCommands, $commandsByPath);

			asort($commands);

			foreach (array_unique($commands) as $command) {
				$io->writeLine(Util::camelCaseToHyphen(lcfirst($command)));
			}
		}
	}

}
