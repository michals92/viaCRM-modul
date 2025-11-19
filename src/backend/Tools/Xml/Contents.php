<?php

namespace Espo\Modules\Autocrm\Tools\Xml;

use GuzzleHttp\Psr7\Stream;
use Psr\Http\Message\StreamInterface;
use RuntimeException;

class Contents implements \Espo\Tools\Pdf\Contents {

	public function __construct(
		private readonly string $fileName,
		private readonly string $contents,
	) {}

	public function getStream(): StreamInterface {
		$resource = fopen('php://temp', 'r+');

		if ($resource === false) {
			throw new RuntimeException('Could not open temp.');
		}

		fwrite($resource, $this->getString());
		rewind($resource);

		return new Stream($resource);
	}

	public function getFileName(): string {
		return $this->fileName;
	}

	public function getString(): string {
		return $this->getContents();
	}

	public function getLength(): int {
		return strlen($this->getContents());
	}

	private function getContents(): string {
		return $this->contents;
	}

}
