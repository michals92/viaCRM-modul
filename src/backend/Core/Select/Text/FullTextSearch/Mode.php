<?php

namespace Espo\Modules\Viacrm\Core\Select\Text\FullTextSearch;

class Mode
{
	public const NATURAL_LANGUAGE = 'NATURAL_LANGUAGE';
	public const BOOLEAN = 'BOOLEAN';
	public const LIKE = 'LIKE';

	public const ALLOWED_MODES = [self::NATURAL_LANGUAGE, self::BOOLEAN, self::LIKE];
}
