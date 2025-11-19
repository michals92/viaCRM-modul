<?php

namespace Espo\Modules\Autocrm\Tools\ZipStream;

use ReflectionClass;
use RuntimeException;
use ZipStream\Option\Archive as ArchiveOptions;
use ZipStream\ZipStream;

class Creator {

	/**
	 * Creates a ZipStream instance using reflection to handle different versions of the ZipStream library.
	 * 
	 * This method uses reflection to determine the correct way to instantiate the ZipStream class,
	 * as different versions of the library have different constructor signatures. This approach
	 * ensures compatibility with both older and newer versions of the ZipStream library without
	 * requiring code changes when the library is updated.
	 *
	 * @param  string    $outputName   The name of the output zip file.
	 * @param  resource  $outputStream The output stream to write the zip file to.
	 * @return ZipStream The created ZipStream instance.
	 */
	public function create(string $outputName, $outputStream): ZipStream {
		$reflection = new ReflectionClass(ZipStream::class);
		$constructor = $reflection->getConstructor() ?? throw new RuntimeException('ZipStream constructor not found');
		$parameters = $constructor->getParameters();

		if (count($parameters) === 2) {
			// Old version
			$options = new ArchiveOptions();
			$options->setOutputStream($outputStream);
            
			return new ZipStream($outputName, $options);
		} else {
			// New version
			return new ZipStream(outputName: $outputName, outputStream: $outputStream);
		}
	}

}