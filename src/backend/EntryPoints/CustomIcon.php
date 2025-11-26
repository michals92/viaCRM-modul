<?php

namespace Espo\Modules\Viacrm\EntryPoints;

use Espo\Core\Acl;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\EntryPoint\EntryPoint;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\FileStorage\Manager as FileStorageManager;
use Espo\Core\ORM\EntityManager;
use Espo\Modules\Viacrm\Entities\CustomIcon as CustomIconEntity;

class CustomIcon implements EntryPoint
{
	public function __construct(
		protected EntityManager $entityManager,
		protected FileStorageManager $fileStorageManager,
		protected Acl $acl
	) {
	}

	public function run(Request $request, Response $response): void
	{
		$id = $request->getQueryParam('id');

		if (!$id) {
			throw new BadRequest('No id provided.');
		}

		/** @var CustomIconEntity|null $customIcon */
		$customIcon = $this->entityManager->getEntityById('CustomIcon', $id);

		if (!$customIcon || !$customIcon->getId()) {
			throw new NotFound('CustomIcon not found.');
		}

		$attachment = $customIcon->get('icon');

		if (!$attachment || !$attachment->getId()) {
			throw new NotFound("Attachment not found in 'file' field.");
		}

		$fileName = $attachment->get('name');
		$fileType = $attachment->get('type');
		$fileContent = $this->fileStorageManager->getContents($attachment);

		if (!$fileContent) {
			throw new NotFound('File content not found.');
		}

		// Optimize SVG: Remove width and height
		$optimizedSvg = $this->optimizeSvg($fileContent);

		// Generate ETag
		$etag = md5($optimizedSvg);
		$response->setHeader('ETag', $etag);
		$response->setHeader('Cache-Control', 'public, max-age=31536000');

		// Check If-None-Match header
		$ifNoneMatch = $request->getHeader('If-None-Match');
		if ($ifNoneMatch === $etag) {
			$response->setStatus(304);

			return;
		}

		// Set headers
		$response->setHeader('Content-Type', $fileType);
		$response->setHeader('Content-Disposition', 'inline; filename="' . $fileName . '"');
		$response->setHeader('Content-Length', (string) strlen($optimizedSvg ?: ''));

		// Optionally, enable GZIP if supported by the client
		$acceptEncoding = $request->getHeader('Accept-Encoding');

		if ($acceptEncoding && strpos($acceptEncoding, 'gzip') !== false) {
			$compressedSvg = gzencode($optimizedSvg, 9);
			if ($compressedSvg !== false) {
				$optimizedSvg = $compressedSvg;
				$response->setHeader('Content-Encoding', 'gzip');
				$response->setHeader('Content-Length', (string) strlen($optimizedSvg));
			}
		}

		$response->writeBody($optimizedSvg ?: '');
	}

	/**
	 * Optimize SVG by removing width and height attributes.
	 *
	 * @param string $svgContent
	 *
	 * @return string
	 */
	protected function optimizeSvg(string $svgContent): string
	{
		$dom = new \DOMDocument();

		// Suppress errors due to malformed SVGs
		libxml_use_internal_errors(true);
		$dom->loadXML($svgContent, LIBXML_NOCDATA);
		libxml_clear_errors();

		$svg = $dom->getElementsByTagName('svg')->item(0);

		if ($svg) {
			// Remove width and height attributes
			if ($svg->hasAttribute('width')) {
				$svg->removeAttribute('width');
			}
			if ($svg->hasAttribute('height')) {
				$svg->removeAttribute('height');
			}

			// Optionally, add viewBox if missing (ensure scalability)
			if (!$svg->hasAttribute('viewBox')) {
				// Attempt to compute viewBox from existing width and height if available
				$width = $svg->getAttribute('width') ?: '0';
				$height = $svg->getAttribute('height') ?: '0';
				$svg->setAttribute('viewBox', "0 0 $width $height");
			}
		}

		$result = $dom->saveXML($dom->documentElement);

		return $result !== false ? $result : '';
	}
}
