<?php

namespace Espo\Modules\Viacrm\Api\Mail;

use Espo\Core\Api\Action;
use Espo\Core\Api\Request;
use Espo\Core\Api\Response;
use Espo\Core\Api\ResponseComposer;
use Espo\Core\Exceptions\BadRequest;
use Espo\Entities\EmailAccount;
use Espo\Entities\InboundEmail;
use Espo\Entities\User;
use Espo\ORM\EntityManager;
use Espo\ORM\Query\Part\Condition;
use Espo\ORM\Query\Part\Expression;

readonly class GetSignature implements Action {
	public function __construct(
		private EntityManager $entityManager,
		private User          $user
	) {}

	public function process(Request $request): Response {
		// Use EspoCRM's native function to get array of values for emailAddress parameter
		$emailAddresses = $request->getQueryParams()['emailAddress'] ?? [];
		
		// Handle both array and single string values
		if (!is_array($emailAddresses)) {
			$emailAddresses = [$emailAddresses];
		}
		
		if (empty($emailAddresses)) {
			throw new BadRequest('Missing or invalid emailAddress parameter');
		}
		
		$emailAddresses = array_unique($emailAddresses);

		$inboundEmailQuery = $this->entityManager->getQueryBuilder()
			->select(Expression::column('emailAddress'))
			->select(Expression::column('signature'))
			->from(InboundEmail::ENTITY_TYPE)
			->where(
				Condition::in(
					Expression::column('emailAddress'),
					$emailAddresses
				)
			)
			->build();

		$emailAccountQuery = $this->entityManager->getQueryBuilder()
			->select(Expression::column('emailAddress'))
			->select(Expression::column('signature'))
			->from(EmailAccount::ENTITY_TYPE)
			->where(
				Condition::in(
					Expression::column('emailAddress'),
					$emailAddresses
				)
			)
			->build();

		$unionQuery = $this->entityManager
			->getQueryBuilder()
			->union()
			->query($emailAccountQuery)
			->query($inboundEmailQuery)
			->build();

		$result = $this->entityManager
			->getQueryExecutor()
			->execute($unionQuery)
			->fetchAll(\PDO::FETCH_KEY_PAIR);

		$signatures = [];
		
		foreach ($result as $emailAddress => $signature) {
			if (empty($signature)) {
				$signatures[$emailAddress] = null;
			} else {
				$signatures[$emailAddress] = $this->processPlaceholders($signature);
			}
		}

		return ResponseComposer::json($signatures);
	}

	private function processPlaceholders(string $signature): string {
		preg_match_all('/\{([^}]+)}/', $signature, $matches);

		if (!empty($matches[1])) {
			foreach ($matches[1] as $placeholder) {
				$value = $this->user->get($placeholder) ?? '';
				$signature = str_replace("{{$placeholder}}", $value, $signature);
			}
		}

		return $signature;
	}
}