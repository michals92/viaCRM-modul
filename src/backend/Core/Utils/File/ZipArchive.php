<?php

namespace Espo\Core\Utils\File;

use Espo\Core\Utils\File\Manager as FileManager;
use RuntimeException;

class ZipArchive {

	private FileManager $fileManager;

	public function __construct(
		?FileManager $fileManager = null
	) {
		$this->fileManager = $fileManager ?? new FileManager();
	}

	/**
	 * Unzip archive.
	 *
	 * @param  string $file            Path to .zip file.
	 * @param  string $destinationPath Destination path.
	 * @return bool
	 */
	public function unzip($file, $destinationPath) {
		if (!class_exists('\ZipArchive')) {
			throw new RuntimeException('php-zip extension is not installed. Cannot unzip the file. Your php version is: ' . phpversion());
		}

		$zip = new \ZipArchive;

		$res = $zip->open($file);

		if ($res === true) {
			$this->fileManager->mkdir($destinationPath);

			$zip->extractTo($destinationPath);
			$zip->close();

			return true;
		} else {
			switch ($res) {
				case \ZipArchive::ER_MULTIDISK:
					fwrite(STDERR, 'Multi-disk zip archives not supported.' . PHP_EOL);
					break;
				case \ZipArchive::ER_RENAME:
					fwrite(STDERR, 'Renaming temporary file failed.' . PHP_EOL);
					break;
				case \ZipArchive::ER_CLOSE:
					fwrite(STDERR, 'Closing zip archive failed' . PHP_EOL);
					break;
				case \ZipArchive::ER_SEEK:
					fwrite(STDERR, 'Seek error' . PHP_EOL);
					break;
				case \ZipArchive::ER_NOZIP:
					fwrite(STDERR, 'File is not a zip archive' . PHP_EOL);
					break;
				case \ZipArchive::ER_MEMORY:
					fwrite(STDERR, 'Malloc failure' . PHP_EOL);
					break;
				case \ZipArchive::ER_INCONS:
					fwrite(STDERR, 'Zip archive inconsistent' . PHP_EOL);
					break;
				case \ZipArchive::ER_READ:
					fwrite(STDERR, "Can't read file" . PHP_EOL);
					break;
				case \ZipArchive::ER_WRITE:
					fwrite(STDERR, "Can't write to file" . PHP_EOL);
					break;
				case \ZipArchive::ER_CRC:
					fwrite(STDERR, 'CRC error' . PHP_EOL);
					break;
				case \ZipArchive::ER_ZLIB:
					fwrite(STDERR, 'Zlib error' . PHP_EOL);
					break;
				case \ZipArchive::ER_REMOVE:
					fwrite(STDERR, "Can't remove file" . PHP_EOL);
					break;
				case \ZipArchive::ER_DELETED:
					fwrite(STDERR, 'Entry has been deleted' . PHP_EOL);
					break;
				default:
					if (method_exists($zip, 'getStatusString')) {
						fwrite(STDERR, $zip->getStatusString() . PHP_EOL);
					}
			}

			return false;
		}
	}

}
