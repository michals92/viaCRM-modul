<?php

namespace Espo\Modules\Autocrm\Core\Mail\Importer;

use Espo\Core\Mail\Message;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Log;
use Espo\Core\Utils\Metadata;
use Espo\Entities\Email;
use Espo\Entities\EmailAddress;
use Espo\Modules\Autocrm\Classes\Repositories\EmailAddress as EmailAddressRepository;
use Espo\Modules\Autocrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Crm\Entities\Account;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

class DefaultParentFinder extends \Espo\Core\Mail\Importer\DefaultParentFinder {

	private EmailAddressRepository $emailAddressRepository;

	public function __construct(
		EntityManager             $entityManager,
		protected readonly Config $config,
		Metadata                  $metadata,
		protected readonly Log    $log
	) {
		/** @var EmailAddressRepository $emailAddressRepository */
		$emailAddressRepository = $entityManager->getRepository(EmailAddress::ENTITY_TYPE);
		$this->emailAddressRepository = $emailAddressRepository;
		parent::__construct($entityManager, $config, $metadata);
	}

	public function find(Email $email, Message $message): ?Entity {
		$emailParentFinderOrder = $this->config->get('emailParentFinderOrder', []);
		if (empty($emailParentFinderOrder) || !is_array($emailParentFinderOrder)) {
			return parent::find($email, $message);
		}

		foreach ($emailParentFinderOrder as $findType) {
			$normalizedType = strtolower(trim($findType));

			if ($normalizedType === 'default') {
				return parent::find($email, $message);
			}

			$parent = $this->callParentFinderMethod($normalizedType, $email, $message);

			if ($parent) {
				return $parent;
			}
		}

		return null;
	}

	/**
	 * Calls the appropriate parent finder method based on the finder type.
	 * Uses switch statement for PHPStan static analysis compatibility.
	 */
	private function callParentFinderMethod(string $finderType, Email $email, Message $message): ?Entity {
		switch ($finderType) {
			case 'references':
				return $this->callGetByReferences($message);
			case 'from':
				return $this->callGetByFromAddress($email);
			case 'to':
				return $this->callGetByToAddress($email);
			case 'fromreplied':
				return $this->callGetFromReplied($email);
			case 'replyto':
				return $this->callGetByReplyToAddress($email);
			default:
				$this->log->warning('DefaultParentFinder invalid findType: ' . $finderType);

				return null;
		}
	}

	/**
	 * Wrapper for parent::getByReferences() method
	 */
	private function callGetByReferences(Message $message): ?Entity {
		try {
			return ReflectionUtil::callClassMethod(parent::class, $this, 'getByReferences', $message);
		} catch (\ReflectionException $e) {
			$this->log->warning('DefaultParentFinder getByReferences method call failed: ' . $e->getMessage());

			return null;
		}
	}

	/**
	 * Wrapper for parent::getByFromAddress() method
	 */
	private function callGetByFromAddress(Email $email): ?Entity {
		try {
			return ReflectionUtil::callClassMethod(parent::class, $this, 'getByFromAddress', $email);
		} catch (\ReflectionException $e) {
			$this->log->warning('DefaultParentFinder getByFromAddress method call failed: ' . $e->getMessage());

			return null;
		}
	}

	/**
	 * Wrapper for parent::getByToAddress() method
	 */
	private function callGetByToAddress(Email $email): ?Entity {
		try {
			return ReflectionUtil::callClassMethod(parent::class, $this, 'getByToAddress', $email);
		} catch (\ReflectionException $e) {
			$this->log->warning('DefaultParentFinder getByToAddress method call failed: ' . $e->getMessage());

			return null;
		}
	}

	/**
	 * Wrapper for parent::getFromReplied() method
	 */
	private function callGetFromReplied(Email $email): ?Entity {
		try {
			return ReflectionUtil::callClassMethod(parent::class, $this, 'getFromReplied', $email);
		} catch (\ReflectionException $e) {
			$this->log->warning('DefaultParentFinder getFromReplied method call failed: ' . $e->getMessage());

			return null;
		}
	}

	/**
	 * Wrapper for parent::getByReplyToAddress() method
	 */
	private function callGetByReplyToAddress(Email $email): ?Entity {
		try {
			return ReflectionUtil::callClassMethod(parent::class, $this, 'getByReplyToAddress', $email);
		} catch (\ReflectionException $e) {
			$this->log->warning('DefaultParentFinder getByReplyToAddress method call failed: ' . $e->getMessage());

			return null;
		}
	}

	public function getByAddress(string $emailAddress): ?Entity {
		return $this->emailAddressRepository->getEntityByAddress($emailAddress, Account::ENTITY_TYPE);
	}

	// TODO: These methods are not currently used but kept for future reference
	// as they were part of custom parent finding logic
	/*
	private function getByFromAddress(Email $email): ?Entity {
		$from = $email->getFromAddress();

		if (!$from) {
			return null;
		}

		return $this->getByAddress($from);
	}

	private function getByToAddress(Email $email): ?Entity {
		$list = $email->getToAddressList();

		if (empty($list)) {
			return null;
		}

		return $this->getByAddress($list[0]);
	}
	*/

}
