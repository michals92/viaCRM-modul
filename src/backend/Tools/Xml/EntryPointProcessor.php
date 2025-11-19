<?php

namespace Espo\Modules\Autocrm\Tools\Xml;

use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\ORM\EntityManager;
use Espo\Core\Select\SearchParams;
use Espo\Core\Select\SelectBuilderFactory;
use Espo\Core\Utils\Json;
use Espo\Modules\Autocrm\Entities\XmlFeed as XmlFeedEntity;
use Espo\Modules\Autocrm\Entities\XmlTemplate;

class EntryPointProcessor {

	public function __construct(
		private readonly EntityManager $entityManager,
		private readonly SelectBuilderFactory $selectBuilderFactory,
		private readonly Service $service
	) {}

	public function process(Request $request, Response $response, bool $publicAccess): void {
		$feedId = $request->getQueryParam('id') ?? throw new BadRequest();

		/** @var XmlFeedEntity $feed */
		$feed = $this->entityManager->getEntityById(XmlFeedEntity::ENTITY_TYPE, $feedId) ?? throw new NotFound();

		if ($publicAccess && !$feed->get('isPublic')) {
			throw new NotFound();
		}

		/** @var XmlTemplate $template */
		$template = $this->entityManager
		    ->getRelation($feed, 'template')
		    ->findOne() ?? throw new NotFound();

		$filters = $feed->get('filtersProcessed') ?? [];

		$filters = Json::decode(Json::encode($filters), true);

		$searchParams = SearchParams::fromRaw(['where' => (array)$filters]);

		$query = $this
		    ->selectBuilderFactory
		    ->create()
		    ->from($template->getTargetEntityType())
		    ->withSearchParams($searchParams)
		    ->build();

		$collection = $this
		    ->entityManager
		    ->getRDBRepository($template->getTargetEntityType())
		    ->clone($query)
		    ->sth()
		    ->find();

		// Get the custom tag from the feed or use "Root" as default
		$rootTag = $feed->get('customTag') ?: 'Root';
		$rootTag = htmlspecialchars($rootTag);
        
		$response->writeBody('<?xml version="1.0" encoding="UTF-8"?><' . $rootTag . '>');

		// Initialize $contents to null
		$contents = null;

		foreach ($collection as $entity) {
			$contents = $this->service->generate($template->getTargetEntityType(), $entity->getId(), $template->getId());

			$replaceEntries = $this
				->entityManager
				->getRelation($feed, 'replaceEntries')
				->find();
			
			$body = $contents->getString();

			foreach ($replaceEntries as $replaceEntry) {
				$body = str_replace($replaceEntry->get('find'), $replaceEntry->get('replace'), $body);
			}

			$response->writeBody($body);
		}

		$response->writeBody('</' . $rootTag . '>');

		$response
		    ->setHeader('Content-Type', 'application/xml')
		    ->setHeader('Cache-Control', 'private, must-revalidate, post-check=0, pre-check=0, max-age=1')
		    ->setHeader('Pragma', 'public')
		    ->setHeader('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT')
		    ->setHeader('Last-Modified', gmdate('D, d M Y H:i:s') . ' GMT')
		    ->setHeader('Content-Disposition', 'inline; filename="' . 'feed.xml' . '"');
	}

}
