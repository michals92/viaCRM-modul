<?php

namespace Espo\Modules\Viacrm\Core\Console;

/**
 * Defines the contract for EspoCRM commands that can provide autocompletion suggestions.
 *
 * Implementing this interface allows a command to integrate with shell autocompletion
 */
interface CommandAutocomplete {

	/**
	 * Generates autocompletion suggestions based on the current command input.
	 *
	 * The method receives the tokenized command line input and the specific
	 * word fragment the user is currently trying to complete. It should return
	 * an array of suggestion strings.
	 *
	 * @param  string[] $inputWords  An ordered list of words/tokens from the current command line input.
	 *                               Example: ['your-command', '--option1', 'value-so-far']
	 * @param  string   $currentWord The specific word/token fragment that the user is currently trying to complete.
	 *                               This is usually the last element of $inputWords if completing at the end,
	 *                               or a word from the middle if the cursor is elsewhere.
	 *                               Example: 'value-so-far'
	 * @return string[] An array of suggestion strings. These strings will be presented to the user
	 *                  as possible completions.
	 *                  Example: ['value-so-far-optionA', 'value-so-far-optionB']
	 */
	public function getAutocompleteSuggestions(array $inputWords, string $currentWord): array;

}