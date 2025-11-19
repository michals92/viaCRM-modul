<?php

namespace Espo\Modules\Autocrm\Tools\Layout;

class RowBuilder {

	/** @var array<string, mixed>|bool $row */
	protected array|bool $row;

	public function __construct(
		protected readonly RowGroupBuilder $rowGroupBuilder
	) {}

	/**
	 * @param array<string, mixed>|bool $row
	 */
	public function &setRow(array|bool &$row): self {
		$this->row = &$row;

		return $this;
	}

	public function getName(): ?string {
		if ($this->isEmpty()) {
			return null;
		}
		assert(is_array($this->row));

		return $this->row['name'];
	}

	/**
	 * @param null|array<string, string> $translations (key - language shortcode, value - translation)
	 */
	public function setName(string $name, ?array $translations = null): self {
		if ($this->isEmpty()) {
			$row = [];
			$this->row = &$row;
		}
		assert(is_array($this->row));

		$this->row['name'] = $name;
		$this->getLayoutBuilder()->addTranslationFromArray('fields', $name, $translations);

		return $this;
	}

	public function &setEmpty(): self {
		$this->row = false;

		return $this;
	}

	public function isEmpty(): bool {
		return is_bool($this->row);
	}

	public function build(): RowGroupBuilder {
		return $this->rowGroupBuilder;
	}

	public function getLayoutBuilder(): LayoutBuilder {
		return $this->rowGroupBuilder->getLayoutBuilder();
	}

}