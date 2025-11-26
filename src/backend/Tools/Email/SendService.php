<?php

namespace Espo\Modules\Viacrm\Tools\Email;

use Espo\Core\Acl;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\ErrorSilent;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Mail\Account\GroupAccount\AccountFactory as GroupAccountFactory;
use Espo\Core\Mail\Account\PersonalAccount\AccountFactory as PersonalAccountFactory;
use Espo\Core\Mail\EmailSender;
use Espo\Core\Mail\Exceptions\NoSmtp;
use Espo\Core\Mail\Exceptions\SendingError;
use Espo\Core\Mail\Smtp\HandlerProcessor;
use Espo\Core\Mail\SmtpParams;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Json;
use Espo\Core\Utils\Log;
use Espo\Entities\Email;
use Espo\Entities\EmailAccount;
use Espo\Entities\InboundEmail;
use Espo\Entities\User;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\ORM\EntityManager;
use Espo\Tools\Email\TestSendData;
use Exception;

/**
 * This overrides the default because we need to backport this fix: https://github.com/espocrm/espocrm/commit/1d685dc7723a77e8c6691249a9abba62201ae671 to older versions.
 */
class SendService extends \Espo\Tools\Email\SendService
{
	/**
	 * @throws Forbidden
	 * @throws Error
	 * @throws NotFound
	 * @throws NoSmtp
	 */
	public function sendTestEmail(SmtpParams $params, TestSendData $data): void
	{
		/** @var Log $log */
		$log = ReflectionUtil::getClassProperty(parent::class, $this, 'log');
		/** @var EmailSender $emailSender */
		$emailSender = ReflectionUtil::getClassProperty(parent::class, $this, 'emailSender');
		/** @var User $user */
		$user = ReflectionUtil::getClassProperty(parent::class, $this, 'user');
		/** @var EntityManager $entityManager */
		$entityManager = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManager');
		/** @var HandlerProcessor $handlerProcessor */
		$handlerProcessor = ReflectionUtil::getClassProperty(parent::class, $this, 'handlerProcessor');

		$emailAddress = $data->getEmailAddress();
		$userId = $data->getUserId();
		$type = $data->getType();
		$id = $data->getId();

		if ($params->getPassword() === null) {
			$params = $params->withPassword(
				$this->obtainSendTestEmailPassword($type, $id)
			);
		}

		$fromAddress = $params->getFromAddress();

		if (
			$userId &&
			$userId !== $user->getId() &&
			!$user->isAdmin()
		) {
			throw new Forbidden();
		}

		/** @var ?User $user */
		$user = $userId ?
			$entityManager->getRDBRepositoryByClass(User::class)->getById($userId) :
			null;

		if ($userId && !$user) {
			throw new NotFound('User not found.');
		}

		/** @var Email $email */
		$email = $entityManager->getNewEntity(Email::ENTITY_TYPE);

		$email
			->setSubject('EspoCRM: Test Email')
			->setIsHtml(false)
			->addToAddress($emailAddress);

		$handlerClassName = null;

		if ($type === 'emailAccount' && $id) {
			/** @var ?EmailAccount $emailAccount */
			$emailAccount = $entityManager->getEntityById(EmailAccount::ENTITY_TYPE, $id);

			$handlerClassName = $emailAccount?->getSmtpHandlerClassName();
		}

		if ($type === 'inboundEmail' && $id) {
			/** @var ?InboundEmail $inboundEmail */
			$inboundEmail = $entityManager->getEntityById(InboundEmail::ENTITY_TYPE, $id);

			if ($inboundEmail) {
				$handlerClassName = $inboundEmail->getSmtpHandlerClassName();
			}
		}

		if ($handlerClassName && $id) {
			$params = $handlerProcessor->handle($handlerClassName, $params, $id);
		}

		// For bc. The applyUserHandler method was removed in later versions, so we have to check at runtime.
		if (ReflectionUtil::classMethodExists(\Espo\Tools\Email\SendService::class, 'applyUserHandler')) {
			if ($user && $fromAddress) {
				$params = ReflectionUtil::callClassMethod(\Espo\Tools\Email\SendService::class, $this, 'applyUserHandler', $user, $params, $fromAddress);
			}
		}

		try {
			$emailSender
				->withSmtpParams($params)
				->send($email);
		} catch (Exception $e) {
			$log->warning('Email sending:' . $e->getMessage() . '; ' . $e->getCode());

			if ($e instanceof SendingError) {
				throw ErrorSilent::createWithBody(
					'sendingFail',
					Error\Body::create()
						->withMessageTranslation($e->getMessage(), Email::ENTITY_TYPE)
				);
			}

			$errorData = ['message' => $e->getMessage()];

			throw ErrorSilent::createWithBody('sendingFail', Json::encode($errorData));
		}
	}

	/**
	 * @throws Forbidden
	 * @throws Error
	 * @throws NoSmtp
	 */
	private function obtainSendTestEmailPassword(?string $type, ?string $id): ?string
	{
		/** @var Acl $acl */
		$acl = ReflectionUtil::getClassProperty(parent::class, $this, 'acl');
		/** @var User $user */
		$user = ReflectionUtil::getClassProperty(parent::class, $this, 'user');
		/** @var GroupAccountFactory $groupAccountFactory */
		$groupAccountFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'groupAccountFactory');
		/** @var PersonalAccountFactory $personalAccountFactory */
		$personalAccountFactory = ReflectionUtil::getClassProperty(parent::class, $this, 'personalAccountFactory');
		/** @var Config $config */
		$config = ReflectionUtil::getClassProperty(parent::class, $this, 'config');

		if ($type === 'emailAccount') {
			if (!$acl->checkScope(EmailAccount::ENTITY_TYPE)) {
				throw new Forbidden();
			}

			if (!$id) {
				return null;
			}

			$personalAccount = $personalAccountFactory->create($id);

			if (
				!$user->isAdmin() &&
				$personalAccount->getUser()->getId() !== $user->getId()
			) {
				throw new Forbidden();
			}

			$smtpParams = $personalAccount->getSmtpParams();

			return $smtpParams?->getPassword();
		}

		if (!$user->isAdmin()) {
			throw new Forbidden();
		}

		if ($type === 'inboundEmail') {
			if (!$id) {
				return null;
			}

			$smtpParams = $groupAccountFactory
				->create($id)
				->getSmtpParams();

			return $smtpParams?->getPassword();
		}

		return $config->get('smtpPassword');
	}
}
