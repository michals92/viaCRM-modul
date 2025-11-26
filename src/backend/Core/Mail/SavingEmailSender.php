<?php

namespace Espo\Modules\Viacrm\Core\Mail;

use Espo\Core\Di;
use Espo\Core\Mail\EmailSender;
use Espo\Entities\Email;
use Throwable;

/**
 * This class is a thin wrapper around the original and is used to
 * hack saving emails when it is injected instead of the regular EmailSender and the appropriate option is set
 */
class SavingEmailSender extends EmailSender implements Di\ConfigAware, Di\EntityManagerAware, Di\LogAware {
	use Di\ConfigSetter;
	use Di\EntityManagerSetter;
	use Di\LogSetter;

	public function send(Email $email): void {
		parent::send($email);
        
		// Check if save assignment emails setting is enabled
		if ($this->config->get('saveAssignmentEmails', false)) {
			try {
				$this->entityManager->saveEntity($email);
			} catch (Throwable $e) {
				$this->log->error('Failed to save assignment email: ' . $e->getMessage());
			}
		}
	}
}
