<?php

namespace Espo\Modules\Viacrm\Tools\Aggregation;

class AggregationEntry
{
	private string $name;

	private string $function;

	private string $field;

	private function __construct()
	{
	}

	public static function create(): self
	{
		return new self();
	}

	public function withName(string $name): self
	{
		$obj = clone $this;
		$obj->name = $name;

		return $obj;
	}

	public function withFunction(string $function): self
	{
		$obj = clone $this;
		$obj->function = $function;

		return $obj;
	}

	public function withField(string $field): self
	{
		$obj = clone $this;
		$obj->field = $field;

		return $obj;
	}

	public function getName(): string
	{
		return $this->name;
	}

	public function getFunction(): string
	{
		return $this->function;
	}

	public function getField(): string
	{
		return $this->field;
	}
}
