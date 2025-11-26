<?php

namespace Espo\Modules\Viacrm\Api\Document;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\ORM\EntityManager;
use Espo\Entities\Attachment;
use Espo\Modules\Crm\Entities\Document;
use Espo\Modules\Crm\Entities\DocumentFolder;

class UploadFromZip implements Action {
	public function __construct(
		private readonly EntityManager $entityManager,
	) {}
    
	/** @var array<string, array<string, string>> */
	private array $folderCache = [];

	public function process(Request $request): Response {
		$body = $request->getBodyContents();

		if ($body === null) {
			throw new BadRequest();
		}

		$categoryId = $request->getRouteParam('categoryId');

		$base64Data = str_replace([
		    'data:application/zip;base64,', /* Linux */
		    'data:application/x-zip-compressed;base64,' /* Windows */
		], '', $body);

		$tempFile = tempnam(sys_get_temp_dir(), 'zip');
		file_put_contents($tempFile, base64_decode($base64Data));

		$zip = new \ZipArchive();
		$res = $zip->open($tempFile);

		if ($res !== true) {
			switch ($res) {
				case \ZipArchive::ER_NOENT:
					throw new BadRequest('No such file.');
				case \ZipArchive::ER_NOZIP:
					throw new BadRequest('Not a zip archive.');
				case \ZipArchive::ER_INCONS:
					throw new BadRequest('Zip archive inconsistent.');
				case \ZipArchive::ER_MEMORY:
					throw new BadRequest('Malloc failure.');
				case \ZipArchive::ER_READ:
					throw new BadRequest('Read error.');
				case \ZipArchive::ER_SEEK:
					throw new BadRequest('Seek error.');
				default:
					throw new BadRequest('Failed to open ZIP archive.');
			}
		}

		$numFiles = 0;

		for ($i = 0; $i < $zip->numFiles; $i++) {
			$entryPath = $zip->getNameIndex($i);

			if ($entryPath) {
				if (substr($entryPath, -1) === '/') {
					$this->lookupOrCreateFolder($entryPath, $categoryId);
				} else {
					$this->createDocument($zip, $entryPath, $i, $categoryId);
					$numFiles++;
				}
			}
		}

		$zip->close();
		unlink($tempFile);

		return ResponseComposer::json(['numFiles' => $numFiles]);
	}

	private function lookupFolder(string $path, ?string $parentId): ?DocumentFolder {
		$em = $this->entityManager;
		$segments = explode('/', trim($path, '/'));
		$currentParentId = $parentId;

		foreach ($segments as $segment) {
			if ($segment === '.' || $segment === '') {
				continue;
			}
			if ($segment === '..') {
				$currentParentId = $this->getParentFolderId($currentParentId);
				continue;
			}

			if (isset($this->folderCache[$currentParentId][$segment])) {
				$currentParentId = $this->folderCache[$currentParentId][$segment];
				continue;
			}

			$folder = $em
			    ->getRDBRepository(DocumentFolder::ENTITY_TYPE)
			    ->where(['name' => $segment, 'parentId' => $currentParentId])
			    ->findOne();

			if (!$folder) {
				return null;
			}

			$this->folderCache[$currentParentId][$segment] = $folder->getId();
			$currentParentId = $folder->getId();
		}

		if (!$currentParentId) {
			return null;
		}

		/** @var DocumentFolder|null */
		return $em->getEntityById(DocumentFolder::ENTITY_TYPE, $currentParentId);
	}

	private function lookupOrCreateFolder(string $path, ?string $categoryId): ?DocumentFolder {
		$segments = explode('/', trim($path, '/'));
		$currentParentId = $categoryId;
		$parentFolder = $categoryId ? $this->lookupFolderById($categoryId) : null;

		foreach ($segments as $segment) {
			if ($segment === '.' || $segment === '') {
				continue;
			}
			if ($segment === '..') {
				$currentParentId = $this->getParentFolderId($currentParentId);
				continue;
			}

			$folder = $this->lookupFolder($segment, $currentParentId);

			if (!$folder) {
				$folder = $this->entityManager->createEntity(DocumentFolder::ENTITY_TYPE, [
				    'name' => $segment,
				    'parentId' => $currentParentId,
				]);
				$this->folderCache[$currentParentId][$segment] = $folder->getId();
			}

			$currentParentId = $folder->getId();
			$parentFolder = $folder;
		}

		return $parentFolder;
	}

	private function lookupFolderById(string $id): ?DocumentFolder {
		/** @var DocumentFolder|null */
		return $this->entityManager->getEntityById(DocumentFolder::ENTITY_TYPE, $id);
	}

	private function createDocument(\ZipArchive $zip, string $path, int $index, ?string $categoryId): void {
		$em = $this->entityManager;
		$folderPath = dirname($path);
		$folder = $this->lookupOrCreateFolder($folderPath, $categoryId);

		$attachment = $em->createEntity(Attachment::ENTITY_TYPE, [
		    'name' => basename($path),
		    'contents' => $zip->getFromIndex($index),
		]);

		$em->createEntity(Document::ENTITY_TYPE, [
		    'name' => basename($path),
		    'fileId' => $attachment->getId(),
		    'folderId' => $folder?->getId()
		]);
	}

	private function getParentFolderId(?string $currentParentId): ?string {
		if (!$currentParentId) {
			return null;
		}

		$folder = $this->entityManager->getEntityById(DocumentFolder::ENTITY_TYPE, $currentParentId);

		return $folder ? $folder->get('parentId') : null;
	}
}
