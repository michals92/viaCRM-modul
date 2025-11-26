<?php

namespace Espo\Modules\Viacrm;

use Espo\Core\Acl\AccessChecker\AccessCheckerFactory;
use Espo\Core\Acl\Map\DataBuilder;
use Espo\Core\Api\ErrorOutput;
use Espo\Core\Binding\Binder;
use Espo\Core\Binding\BindingProcessor;
use Espo\Core\FieldProcessing\Relation\LinkMultipleSaver;
use Espo\Core\Hook\GeneralInvoker;
use Espo\Core\Job\JobRunner;
use Espo\Core\Mail\EmailSender;
use Espo\Core\Mail\Importer\ParentFinder;
use Espo\Core\Record\Hook\Provider as RecordHookProvider;
use Espo\Core\Select\Applier\Factory as SelectApplierFactory;
use Espo\Core\Select\Text\FullTextSearch\DataComposerFactory as FullTextSearchDataComposerFactory;
use Espo\Core\Utils\Language;
use Espo\Modules\Crm\Tools\Activities\Service as ActivitiesService;
use Espo\Modules\Crm\Tools\Calendar\Service as CalendarService;
use Espo\Modules\Viacrm\Core\Acl\Table\DefaultTableFactory;
use Espo\Modules\Viacrm\Core\Mail\Importer\DefaultParentFinder;
use Espo\Modules\Viacrm\Core\Record\EntityAwareCreateParamsFetcher;
use Espo\Modules\Viacrm\Core\Record\EntityAwareDeleteParamsFetcher;
use Espo\Modules\Viacrm\Core\Record\EntityAwareReadParamsFetcher;
use Espo\Modules\Viacrm\Core\Record\EntityAwareUpdateParamsFetcher;
use Espo\Modules\Viacrm\Tools\Layout\UnifiedLayoutProvider;
use Espo\Tools\Email\InboxService;
use Espo\Tools\Email\SendService;
use Espo\Tools\EmailNotification\AssignmentProcessor;
use Espo\Tools\EmailTemplate\Processor as EmailTemplateProcessor;
use Espo\Tools\GlobalSearch\Service as GlobalSearchService;
use Espo\Tools\Layout\LayoutProvider;
use Espo\Tools\User\UsersAccessService;

class Binding implements BindingProcessor
{
	public function process(Binder $binder): void
	{
		// Vanilla Espo Services
		$this->bindAssignmentProcessor($binder);
		$this->bindAcl($binder);
		$this->bindCore($binder);
		$this->bindEmail($binder);
	}

	private function bindCore(Binder $binder): void
	{
		$binder->bindImplementation(ParentFinder::class, DefaultParentFinder::class);

		// Keep this sorted when inserting new bindings
		$binder->bindService(AccessCheckerFactory::class, 'accessCheckerFactory');
		$binder->bindService(ActivitiesService::class, 'activitiesService');
		$binder->bindService(CalendarService::class, 'calendarService');
		$binder->bindService(ErrorOutput::class, 'errorOutput');
		$binder->bindService(FullTextSearchDataComposerFactory::class, 'fullTextSearchDataComposerFactory');
		$binder->bindService(GeneralInvoker::class, 'generalInvoker');
		$binder->bindService(GlobalSearchService::class, 'globalSearchService');
		$binder->bindService(InboxService::class, 'inboxService');
		$binder->bindService(JobRunner::class, 'jobRunner');
		$binder->bindService(Language::class, 'defaultLanguage');
		$binder->bindService(Language::class, 'language');
		$binder->bindService(LayoutProvider::class, 'layoutProvider');
		$binder->bindService(LinkMultipleSaver::class, 'linkMultipleSaver');
		$binder->bindService(EmailTemplateProcessor::class, 'templateProcessor');
		$binder->bindService(RecordHookProvider::class, 'recordHookProvider');
		$binder->bindService(SelectApplierFactory::class, 'selectApplierFactory');
		$binder->bindService(SendService::class, 'sendService');
		$binder->bindService(UnifiedLayoutProvider::class, 'unifiedLayoutProvider');
		$binder->bindService(UsersAccessService::class, 'usersAccessService');

		$binder->bindImplementation(
			'Espo\\Core\\Record\\ReadParamsFetcher',
			EntityAwareReadParamsFetcher::class
		);
		$binder->bindImplementation(
			'Espo\\Core\\Record\\DeleteParamsFetcher',
			EntityAwareDeleteParamsFetcher::class
		);
		$binder->bindImplementation(
			'Espo\\Core\\Record\\CreateParamsFetcher',
			EntityAwareCreateParamsFetcher::class
		);
		$binder->bindImplementation(
			'Espo\\Core\\Record\\UpdateParamsFetcher',
			EntityAwareUpdateParamsFetcher::class
		);
	}

	private function bindEmail(Binder $binder): void
	{
		// IMAP Fetcher bindings (override core IMAP with our implementation)
		$binder
			->for('Espo\\Core\\Mail\\Account\\PersonalAccount\\Service')
			->bindFactory(
				'Espo\\Core\\Mail\\Account\\Fetcher',
				\Espo\Modules\Viacrm\Core\Mail\Account\PersonalAccount\FetcherFactory::class
			);

		$binder
			->for('Espo\\Core\\Mail\\Account\\GroupAccount\\Service')
			->bindFactory(
				'Espo\\Core\\Mail\\Account\\Fetcher',
				\Espo\Modules\Viacrm\Core\Mail\Account\GroupAccount\FetcherFactory::class
			);

		// EWS Fetcher bindings for our EWS Services
		$binder
			->for('Espo\\Modules\\Viacrm\\Core\\Mail\\Account\\Ews\\PersonalAccount\\Service')
			->bindFactory(
				'Espo\\Modules\\Viacrm\\Core\\Mail\\Account\\Ews\\Fetcher',
				'Espo\\Modules\\Viacrm\\Core\\Mail\\Account\\Ews\\PersonalAccount\\FetcherFactory'
			);

		$binder
			->for('Espo\\Modules\\Viacrm\\Core\\Mail\\Account\\Ews\\GroupAccount\\Service')
			->bindFactory(
				'Espo\\Modules\\Viacrm\\Core\\Mail\\Account\\Ews\\Fetcher',
				'Espo\\Modules\\Viacrm\\Core\\Mail\\Account\\Ews\\GroupAccount\\FetcherFactory'
			);
	}

	private function bindAcl(Binder $binder): void
	{
		$binder->bindImplementation(
			'Espo\\Core\\Acl\\Table\\TableFactory',
			DefaultTableFactory::class
		);

		$binder->bindService(DataBuilder::class, 'aclDataBuilder');
	}

	private function bindAssignmentProcessor(Binder $binder): void
	{
		$binder->for(AssignmentProcessor::class)
			->bindService(EmailSender::class, 'savingEmailSender');
	}
}
