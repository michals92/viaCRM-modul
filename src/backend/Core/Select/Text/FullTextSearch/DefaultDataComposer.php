<?php

namespace Espo\Modules\Viacrm\Core\Select\Text\FullTextSearch;

use Espo\Core\Select\Text\FullTextSearch\DataComposer\Params;
use Espo\Core\Select\Text\MetadataProvider;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Database\Helper as DatabaseHelper;
use Espo\Core\Utils\Metadata;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\Query\Part\Expression;
use Espo\ORM\Query\Part\Expression\Util as ExpressionUtil;
use ReflectionException;

class DefaultDataComposer extends \Espo\Core\Select\Text\FullTextSearch\DefaultDataComposer {
	/** @var array<Mode::*, string> */
	private array $functionMap = [
		Mode::BOOLEAN => 'MATCH_BOOLEAN',
		Mode::NATURAL_LANGUAGE => 'MATCH_NATURAL_LANGUAGE',
		Mode::LIKE => 'LIKE',
	];

	protected int $ft_min_word_len;

	public function __construct(
		private string $entityType,
		private Config $config,
		private MetadataProvider $metadataProvider,
		private DatabaseHelper $databaseHelper,
		private Metadata $metadata
	) {
		// Postgres has no ft_min_word_len
		$ft_min_word_len = $this->databaseHelper->getType() === 'Mysql' ? $this->databaseHelper->getParam('ft_min_word_len') : $this->config->get('fullTextSearchMinLength');

		$this->ft_min_word_len = is_numeric($ft_min_word_len) ? (int) $ft_min_word_len : 6;

		parent::__construct($this->entityType, $this->config, $this->metadataProvider);
	}

	/**
	 * @throws ReflectionException
	 */
	public function compose(string $filter, Params $params): ?\Espo\Core\Select\Text\FullTextSearch\Data {
		if ($this->config->get('fullTextSearchDisabled')) {
			return null;
		}

		$columnList = $this->metadataProvider->getFullTextSearchColumnList($this->entityType) ?? [];

		if (!count($columnList)) {
			return null;
		}

		$fieldList = [];

		foreach ($this->getTextFilterFieldList() as $field) {
			if (str_contains($field, '.')) {
				continue;
			}

			if ($this->metadataProvider->isFieldNotStorable($this->entityType, $field)) {
				continue;
			}

			if (!$this->metadataProvider->isFullTextSearchSupportedForField($this->entityType, $field)) {
				continue;
			}

			$fieldList[] = $field;
		}

		if (!count($fieldList)) {
			return null;
		}

		$preparedFilter = $this->prepareFilter($filter, $params);

		// Get the fullTextSearchMode configuration for this entity
		$searchMode = $this->metadata->get(['entityDefs', $this->entityType, 'fullTextSearchMode']) ?? 'Default';

		// Check if escaping special characters is enabled for this entity
		$escapeSpecialCharacters = $this->metadata->get(['entityDefs', $this->entityType, 'fullTextSearchEscapeSpecialCharacters']) ?? false;

		// Check if this contains an abbreviation BEFORE removing dots
		$isAbbreviation = preg_match('/[a-zA-Z](\.[a-zA-Z])+\.?/u', $preparedFilter);

		// If escaping is enabled, remove special characters
		if ($escapeSpecialCharacters && !$isAbbreviation) {
			// Escape special characters that have meaning in boolean mode: + - * " ( ) @ < > ~
			// Also remove dots and other common punctuation that shouldn't affect search
			// BUT preserve dots if it's an abbreviation like "k.t.o."
			$preparedFilter = str_replace(['+', '-', '*', '"', '(', ')', '@', '<', '>', '~', '.', ',', ';', ':'], '', $preparedFilter);

			// Note: We no longer override the search mode here - AllWordsRequired should still work
			// even when special characters are escaped
		} elseif ($escapeSpecialCharacters && $isAbbreviation) {
			// For abbreviations, only remove special chars that aren't dots
			$preparedFilter = str_replace(['+', '-', '*', '"', '(', ')', '@', '<', '>', '~', ',', ';', ':'], '', $preparedFilter);
		}
		
		$mode = Mode::BOOLEAN;

		if (
			(mb_strpos($preparedFilter, ' ') === false) &&
			(mb_strpos($preparedFilter, '+') === false) &&
			(mb_strpos($preparedFilter, ' -') === false) &&
			(mb_strpos($preparedFilter, '-') !== 0) &&
			(mb_strpos($preparedFilter, '*') === false)
		) {
			// Remove punctuation to get the actual token length for mode determination
			$filterWithoutPunctuation = preg_replace('/[\p{P}]/u', '', $preparedFilter);
			
			if ($filterWithoutPunctuation === null || mb_strlen($filterWithoutPunctuation) <= $this->ft_min_word_len) {
				$mode = Mode::LIKE;
			} else {
				$mode = Mode::NATURAL_LANGUAGE;
			}
		} else {
			// For mode detection, check if it's an abbreviation first
			if (preg_match('/^[a-zA-Z](\.[a-zA-Z])+\.?$/u', trim($preparedFilter))) {
				// Abbreviation like "k.t.o." - use LIKE mode as it's typically short
				$mode = Mode::LIKE;
			} else {
				// Split on spaces and major punctuation, but preserve dots within words
				$tokens = preg_split('/[\s\-,;]+/u', trim($preparedFilter), -1, PREG_SPLIT_NO_EMPTY) ?: [];
				$allShort = $tokens !== [] && !array_filter($tokens, fn($t) => mb_strlen(preg_replace('/\./u', '', $t) ?? $t) > $this->ft_min_word_len);
				if ($allShort) {
					$mode = Mode::LIKE;
				}
			}
		}

		if ($mode === Mode::BOOLEAN) {
			$preparedFilter = str_replace('@', '*', $preparedFilter);

			// If AllWordsRequired mode and filter has multiple words without operators
			if ($searchMode === 'AllWordsRequired' &&
				!preg_match('/[+\-*"()]/', $preparedFilter) &&
				str_contains($preparedFilter, ' ')) {
				// Split into words, but preserve dots in abbreviations
				// Split on spaces and word-separating punctuation
				$words = preg_split('/[\s\-,;]+/u', trim($preparedFilter), -1, PREG_SPLIT_NO_EMPTY);
				if ($words !== false && count($words) > 0) {
					// Check if all resulting words are single characters
					// If so, switch to LIKE mode as single-char boolean searches are too broad
					$allSingleChar = !array_filter($words, fn($w) => mb_strlen($w) > 1);
					if ($allSingleChar) {
						$mode = Mode::LIKE;
					} else {
						// Add + prefix to require word; add * suffix for partial matching only if word is 2+ chars
						// Single character searches shouldn't use wildcards as they're too broad
						$preparedFilter = implode(' ', array_map(
							fn($word) => mb_strlen($word) > 1 ? '+' . $word . '*' : '+' . $word,
							$words
						));
					}
				}
			}
		}

		if ($mode === Mode::LIKE) {
			// Split the filter into individual words
			// For abbreviations like "k.t.o.", preserve dots within the word
			// Only split on spaces and punctuation that clearly separates words (hyphen, comma, etc.)
			$filterForSplitting = trim($preparedFilter);

			// Check if this looks like an abbreviation (alternating letters and dots)
			if (preg_match('/^[a-zA-Z](\.[a-zA-Z])+\.?$/u', $filterForSplitting)) {
				// It's an abbreviation like "k.t.o." - treat as single word
				$words = [$filterForSplitting];
			} else {
				// Split on spaces and word-separating punctuation, but not dots
				// This regex splits on: spaces, hyphens, commas, semicolons, but preserves dots
				$words = preg_split('/[\s\-,;]+/u', $filterForSplitting, -1, PREG_SPLIT_NO_EMPTY);
				$words = $words !== false ? $words : [];
			}

			if (count($words) > 1 && $searchMode === 'AllWordsRequired') {
				// Check if ANY word is very short (1-2 chars)
				// If so, use phrase search to avoid false positives
				$hasVeryShortWord = (bool)array_filter($words, fn($w) => mb_strlen($w) <= 2);

				if ($hasVeryShortWord) {
					// For queries with all very short tokens (like "MF 7" or "izs s"),
					// search for the complete phrase to avoid false positives
					// This prevents "MF" matching inside "KOMFORT" etc.
					$phrasePattern = '%' . implode(' ', $words) . '%';

					$likeConditions = array_map(
						static fn($column) => Expression::like(
							Expression::column($column),
							Expression::value($phrasePattern)
						),
						$columnList
					);

					$booleanExpression = Expression::or(...$likeConditions);
				} else {
					// Normal AllWordsRequired mode - each word must match somewhere
					$wordConditions = [];

					foreach ($words as $word) {
						$columnConditions = array_map(
							static fn($column) => Expression::like(
								Expression::column($column),
								Expression::value('%' . $word . '%')
							),
							$columnList
						);
						// Each word must match in at least one column
						$wordConditions[] = Expression::or(...$columnConditions);
					}

					// All words must match (AND between words)
					$booleanExpression = Expression::and(...$wordConditions);
				}
			} else {
				// Single word or default mode - original behavior
				$likeConditions = array_map(
					static fn($column) => Expression::like(
						Expression::column($column),
						Expression::value('%' . $preparedFilter . '%')
					),
					$columnList
				);

				$booleanExpression = Expression::or(...$likeConditions);
			}

			// This has to be here to fix postgres
			$expression = Expression::switch(
				$booleanExpression,
				1,
				0
			);

			return new Data(
				$expression,
				$fieldList,
				$columnList,
				$mode
			);
		}

		$argumentList = array_merge(
			array_map(static fn($item) => Expression::column($item), $columnList),
			[$preparedFilter]
		);

		$function = $this->functionMap[$mode];
		$expression = ExpressionUtil::composeFunction($function, ...$argumentList);

		return new Data(
			$expression,
			$fieldList,
			$columnList,
			$mode
		);
	}

	/**
	 * @throws ReflectionException
	 */
	private function prepareFilter(string $filter, Params $params): string {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'prepareFilter', $filter, $params);
	}

	/**
	 * @throws ReflectionException
	 * @return string[]
	 */
	private function getTextFilterFieldList(): array {
		return ReflectionUtil::callClassMethod(parent::class, $this, 'getTextFilterFieldList');
	}
}
