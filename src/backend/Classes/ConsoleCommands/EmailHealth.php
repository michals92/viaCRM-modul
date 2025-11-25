<?php

namespace Espo\Modules\Viacrm\Classes\ConsoleCommands;

use Espo\Core\Console\Command;
use Espo\Core\Console\Command\Params;
use Espo\Core\Console\IO;
use Espo\Core\Mail\Account\GroupAccount\Service as GroupAccountService;
use Espo\Core\Mail\Account\PersonalAccount\Service as PersonalAccountService;
use Espo\Core\Mail\Account\Storage\Params as StorageParams;
use Espo\Core\Mail\SmtpParams;
use Espo\Core\Utils\Json;
use Espo\Entities\EmailAccount;
use Espo\Entities\InboundEmail;
use Espo\ORM\EntityManager;
use Exception;

class EmailHealth implements Command {

	public function __construct(
		private EntityManager $entityManager,
		private PersonalAccountService $personalAccountService,
		private GroupAccountService $groupAccountService
	) {}

	public function run(Params $params, IO $io): void {
		$format = $params->getOption('format') ?? 'detailed';
		$onlyErrors = $params->hasFlag('errors-only');
		$accountType = $params->getOption('type'); // 'personal', 'group', or null for both
        
		$io->writeLine('Checking email account health...');
		$io->writeLine('');

		// First check for scheduled jobs
		$scheduledJobsInfo = $this->checkScheduledJobs($io, $format);

		$results = [
			'scheduledJobs' => $scheduledJobsInfo
		];

		if (!$accountType || $accountType === 'personal') {
			$personalResults = $this->checkEmailAccounts($io, $format, $onlyErrors);
			$results['personal'] = $personalResults;
		}

		if (!$accountType || $accountType === 'group') {
			if (!$accountType) {
				$io->writeLine('');
			}
			$groupResults = $this->checkInboundEmails($io, $format, $onlyErrors);
			$results['group'] = $groupResults;
		}

		$io->writeLine('');
        
		if ($format === 'json') {
			$io->writeLine(Json::encode($results, JSON_PRETTY_PRINT));
		} else {
			$this->printSummary($results, $io);
		}
	}

	/**
	 * @return array{checkEmailAccounts: array{exists: bool, status?: string, lastRun?: ?string}, checkInboundEmails: array{exists: bool, status?: string, lastRun?: ?string}}
	 */
	private function checkScheduledJobs(IO $io, string $format): array {
		if ($format !== 'json') {
			$io->writeLine('=== Scheduled Jobs Status ===');
		}

		$result = [
			'checkEmailAccounts' => ['exists' => false],
			'checkInboundEmails' => ['exists' => false]
		];

		// Check for CheckEmailAccounts job
		$checkEmailAccountsJob = $this->entityManager
		    ->getRDBRepository('ScheduledJob')
		    ->where(['job' => 'CheckEmailAccounts'])
		    ->findOne();

		if ($checkEmailAccountsJob) {
			$lastRun = $checkEmailAccountsJob->get('lastRun');
			$status = $checkEmailAccountsJob->get('status');
			$result['checkEmailAccounts'] = [
				'exists' => true,
				'status' => $status,
				'lastRun' => $lastRun
			];
			
			if ($format !== 'json') {
				$io->writeLine('✓ CheckEmailAccounts job exists');
				$io->writeLine("  Status: {$status}");
				$io->writeLine('  Last run: ' . ($lastRun ?: 'Never'));
			}
		} else {
			if ($format !== 'json') {
				$io->writeLine('✗ CheckEmailAccounts job NOT FOUND');
			}
		}

		// Check for CheckInboundEmails job
		$checkInboundEmailsJob = $this->entityManager
		    ->getRDBRepository('ScheduledJob')
		    ->where(['job' => 'CheckInboundEmails'])
		    ->findOne();

		if ($checkInboundEmailsJob) {
			$lastRun = $checkInboundEmailsJob->get('lastRun');
			$status = $checkInboundEmailsJob->get('status');
			$result['checkInboundEmails'] = [
				'exists' => true,
				'status' => $status,
				'lastRun' => $lastRun
			];
			
			if ($format !== 'json') {
				$io->writeLine('✓ CheckInboundEmails job exists');
				$io->writeLine("  Status: {$status}");
				$io->writeLine('  Last run: ' . ($lastRun ?: 'Never'));
			}
		} else {
			if ($format !== 'json') {
				$io->writeLine('✗ CheckInboundEmails job NOT FOUND');
			}
		}

		if ($format !== 'json') {
			$io->writeLine('');
		}

		return $result;
	}

	/**
	 * @return array{total: int, healthy: int, errors: int, accounts: array<int, array<string, mixed>>}
	 */
	private function checkEmailAccounts(IO $io, string $format, bool $onlyErrors): array {
		if ($format !== 'json') {
			$io->writeLine('=== Personal Email Accounts (EmailAccount) ===');
		}
        
		/** @var \Espo\ORM\EntityCollection<EmailAccount> $emailAccounts */
		$emailAccounts = $this->entityManager
		    ->getRDBRepository(EmailAccount::ENTITY_TYPE)
		    ->where(['status' => EmailAccount::STATUS_ACTIVE])
		    ->find();

		$results = [
		    'total' => $emailAccounts->count(),
		    'healthy' => 0,
		    'errors' => 0,
		    'accounts' => []
		];

		if ($emailAccounts->count() === 0) {
			if ($format !== 'json') {
				$io->writeLine('No active email accounts found.');
			}

			return $results;
		}

		if ($format !== 'json') {
			$io->writeLine('Found ' . $emailAccounts->count() . ' active email account(s).');
			$io->writeLine('');
		}

		foreach ($emailAccounts as $account) {
			$accountResult = $this->checkEmailAccount($account, $io, $format, $onlyErrors);
			$results['accounts'][] = $accountResult;
            
			if ($accountResult['healthy']) {
				$results['healthy']++;
			} else {
				$results['errors']++;
			}
		}
        
		return $results;
	}

	/**
	 * @return array{id: string, name: string, email: string, healthy: bool, imap: ?string, smtp: ?string, errors: array<int, string>}
	 */
	private function checkEmailAccount(EmailAccount $account, IO $io, string $format, bool $onlyErrors): array {
		$name = $account->get('name') ?: 'Unnamed';
		$email = $account->getEmailAddress() ?: 'No email';
		$id = $account->getId();
        
		$result = [
		    'id' => $id,
		    'name' => $name,
		    'email' => $email,
		    'healthy' => true,
		    'imap' => null,
		    'smtp' => null,
		    'errors' => []
		];

		// Check IMAP if enabled
		if ($account->get('useImap')) {
			try {
				$params = StorageParams::createBuilder()
				    ->setId($id)
				    ->build();
                
				$this->personalAccountService->testConnection($params);
				$result['imap'] = 'OK';
			} catch (Exception $e) {
				$result['healthy'] = false;
				$result['imap'] = 'FAIL';
				$result['errors'][] = 'IMAP: ' . $e->getMessage();
			}
		}

		// Check SMTP if enabled
		if ($account->get('useSmtp')) {
			try {
				$host = $account->getSmtpHost();
				$port = $account->getSmtpPort();
                
				if ($host && $port) {
					$smtpParams = SmtpParams::create($host, $port)
					    ->withAuth($account->getSmtpAuth())
					    ->withSecurity($account->getSmtpSecurity())
					    ->withUsername($account->getSmtpUsername())
					    ->withAuthMechanism($account->getSmtpAuthMechanism());
				}

				// For now, just check if configuration exists
				// TODO: Implement actual SMTP test without sending email
				$result['smtp'] = 'CONFIGURED';
			} catch (Exception $e) {
				$result['healthy'] = false;
				$result['smtp'] = 'ERROR';
				$result['errors'][] = 'SMTP: ' . $e->getMessage();
			}
		}

		// Output based on format
		if ($format !== 'json') {
			if (!$onlyErrors || !$result['healthy']) {
				$io->write("[$id] $name ($email): ");
                
				if ($result['imap']) {
					$io->write("[IMAP: {$result['imap']}] ");
				}
				if ($result['smtp']) {
					$io->write("[SMTP: {$result['smtp']}] ");
				}
                
				if ($result['healthy']) {
					$io->writeLine('✓');
				} else {
					$io->writeLine('✗');
					foreach ($result['errors'] as $error) {
						$io->writeLine("  - $error");
					}
				}
			}
		}
        
		return $result;
	}

	/**
	 * @return array{total: int, healthy: int, errors: int, accounts: array<int, array<string, mixed>>}
	 */
	private function checkInboundEmails(IO $io, string $format, bool $onlyErrors): array {
		if ($format !== 'json') {
			$io->writeLine('=== Group Email Accounts (InboundEmail) ===');
		}
        
		/** @var \Espo\ORM\EntityCollection<InboundEmail> $inboundEmails */
		$inboundEmails = $this->entityManager
		    ->getRDBRepository(InboundEmail::ENTITY_TYPE)
		    ->where(['status' => InboundEmail::STATUS_ACTIVE])
		    ->find();

		$results = [
		    'total' => $inboundEmails->count(),
		    'healthy' => 0,
		    'errors' => 0,
		    'accounts' => []
		];

		if ($inboundEmails->count() === 0) {
			if ($format !== 'json') {
				$io->writeLine('No active inbound email accounts found.');
			}

			return $results;
		}

		if ($format !== 'json') {
			$io->writeLine('Found ' . $inboundEmails->count() . ' active inbound email account(s).');
			$io->writeLine('');
		}

		foreach ($inboundEmails as $account) {
			$accountResult = $this->checkInboundEmail($account, $io, $format, $onlyErrors);
			$results['accounts'][] = $accountResult;
            
			if ($accountResult['healthy']) {
				$results['healthy']++;
			} else {
				$results['errors']++;
			}
		}
        
		return $results;
	}

	/**
	 * @return array{id: string, name: string, email: string, healthy: bool, imap: ?string, smtp: ?string, errors: array<int, string>}
	 */
	private function checkInboundEmail(InboundEmail $account, IO $io, string $format, bool $onlyErrors): array {
		$name = $account->getName() ?: 'Unnamed';
		$email = $account->getEmailAddress() ?: 'No email';
		$id = $account->getId();
        
		$result = [
		    'id' => $id,
		    'name' => $name,
		    'email' => $email,
		    'healthy' => true,
		    'imap' => null,
		    'smtp' => null,
		    'errors' => []
		];

		// Check IMAP if enabled
		if ($account->get('useImap')) {
			try {
				$params = StorageParams::createBuilder()
				    ->setId($id)
				    ->build();
                
				$this->groupAccountService->testConnection($params);
				$result['imap'] = 'OK';
			} catch (Exception $e) {
				$result['healthy'] = false;
				$result['imap'] = 'FAIL';
				$result['errors'][] = 'IMAP: ' . $e->getMessage();
			}
		}

		// Check SMTP if enabled
		if ($account->get('useSmtp')) {
			try {
				$host = $account->getSmtpHost();
				$port = $account->getSmtpPort();
                
				if ($host && $port) {
					$smtpParams = SmtpParams::create($host, $port)
					    ->withAuth($account->getSmtpAuth())
					    ->withSecurity($account->getSmtpSecurity())
					    ->withUsername($account->getSmtpUsername())
					    ->withAuthMechanism($account->getSmtpAuthMechanism());
				}

				// For now, just check if configuration exists
				// TODO: Implement actual SMTP test without sending email
				$result['smtp'] = 'CONFIGURED';
			} catch (Exception $e) {
				$result['healthy'] = false;
				$result['smtp'] = 'ERROR';
				$result['errors'][] = 'SMTP: ' . $e->getMessage();
			}
		}

		// Output based on format
		if ($format !== 'json') {
			if (!$onlyErrors || !$result['healthy']) {
				$io->write("[$id] $name ($email): ");
                
				if ($result['imap']) {
					$io->write("[IMAP: {$result['imap']}] ");
				}
				if ($result['smtp']) {
					$io->write("[SMTP: {$result['smtp']}] ");
				}
                
				if ($result['healthy']) {
					$io->writeLine('✓');
				} else {
					$io->writeLine('✗');
					foreach ($result['errors'] as $error) {
						$io->writeLine("  - $error");
					}
				}
			}
		}
        
		return $result;
	}

	/**
	 * @param array{scheduledJobs: array{checkEmailAccounts: array{exists: bool, status?: string, lastRun?: ?string}, checkInboundEmails: array{exists: bool, status?: string, lastRun?: ?string}}, personal?: array{total: int, healthy: int, errors: int, accounts: array<int, array<string, mixed>>}, group?: array{total: int, healthy: int, errors: int, accounts: array<int, array<string, mixed>>}} $results
	 */
	private function printSummary(array $results, IO $io): void {
		$io->writeLine('=== Summary ===');
        
		$totalAccounts = 0;
		$totalHealthy = 0;
		$totalErrors = 0;
        
		if (isset($results['personal'])) {
			$personal = $results['personal'];
			$totalAccounts += $personal['total'];
			$totalHealthy += $personal['healthy'];
			$totalErrors += $personal['errors'];
            
			$io->writeLine("Personal accounts: {$personal['healthy']}/{$personal['total']} healthy");
		}
        
		if (isset($results['group'])) {
			$group = $results['group'];
			$totalAccounts += $group['total'];
			$totalHealthy += $group['healthy'];
			$totalErrors += $group['errors'];
            
			$io->writeLine("Group accounts: {$group['healthy']}/{$group['total']} healthy");
		}
        
		$io->writeLine('');
		$io->writeLine("Total: $totalHealthy/$totalAccounts healthy");
        
		if ($totalErrors > 0) {
			$io->writeLine("Found $totalErrors account(s) with errors.");
			$io->setExitStatus(1);
		} else {
			$io->writeLine('All email accounts are healthy.');
		}
	}

}