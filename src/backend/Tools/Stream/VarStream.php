<?php

namespace Espo\Modules\Viacrm\Tools\Stream;

use Psr\Http\Message\StreamInterface;

class VarStream {

	/** @var resource */
	public $context;

	private StreamInterface $stream;

	private string $mode;

	/** @var array<int, StreamInterface> */
	private static array $streams = [];

	private static int $idx = 0;

	public static function createReference(StreamInterface $stream): string {
		self::register();

		$idx = self::$idx++;
		self::$streams[$idx] = $stream;

		return 'var-stream://' . $idx;
	}

	/**
	 * Registers the stream wrapper if needed
	 */
	public static function register(): void {
		if (!in_array('var-stream', stream_get_wrappers())) {
			stream_wrapper_register('var-stream', __CLASS__);
		}
	}

	public function stream_open(string $path, string $mode, int $options, string &$opened_path = null): bool {
		$idx = (int)(parse_url($path)['host'] ?? 0);

		if (!isset(self::$streams[$idx])) {
			return false;
		}

		$this->stream = self::$streams[$idx];
		$this->mode = $mode;

		return true;
	}

	public function stream_read(int $count): string {
		return $this->stream->read($count);
	}

	public function stream_write(string $data): int {
		return $this->stream->write($data);
	}

	public function stream_tell(): int {
		return $this->stream->tell();
	}

	public function stream_eof(): bool {
		return $this->stream->eof();
	}

	public function stream_seek(int $offset, int $whence): bool {
		$this->stream->seek($offset, $whence);

		return true;
	}

	/**
	 * @return resource|false
	 */
	public function stream_cast(int $cast_as) {
		$stream = clone ($this->stream);
		$resource = $stream->detach();

		return $resource ?? false;
	}

	/**
	 * @return array<int|string, int>
	 */
	public function stream_stat(): array {
		static $modeMap = [
		    'r' => 33060,
		    'rb' => 33060,
		    'r+' => 33206,
		    'w' => 33188,
		    'wb' => 33188,
		];

		return [
		    'dev' => 0,
		    'ino' => 0,
		    'mode' => $modeMap[$this->mode],
		    'nlink' => 0,
		    'uid' => 0,
		    'gid' => 0,
		    'rdev' => 0,
		    'size' => $this->stream->getSize() ?: 0,
		    'atime' => 0,
		    'mtime' => 0,
		    'ctime' => 0,
		    'blksize' => 0,
		    'blocks' => 0,
		];
	}

	/**
	 * @return array<int|string, int>
	 */
	public function url_stat(string $path, int $flags): array {
		return [
		    'dev' => 0,
		    'ino' => 0,
		    'mode' => 0,
		    'nlink' => 0,
		    'uid' => 0,
		    'gid' => 0,
		    'rdev' => 0,
		    'size' => 0,
		    'atime' => 0,
		    'mtime' => 0,
		    'ctime' => 0,
		    'blksize' => 0,
		    'blocks' => 0,
		];
	}

}
