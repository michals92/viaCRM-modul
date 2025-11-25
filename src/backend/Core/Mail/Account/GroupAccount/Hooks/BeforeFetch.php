<?php

namespace Espo\Modules\Viacrm\Core\Mail\Account\GroupAccount\Hooks;

use Espo\Core\Mail\Account\Account;
use Espo\Core\Mail\Account\GroupAccount\Hooks\BeforeFetch as BeforeFetchHook;
use Espo\Core\Mail\Account\Hook\BeforeFetch as BeforeFetchInterface;
use Espo\Core\Mail\Account\Hook\BeforeFetchResult;
use Espo\Core\Mail\Message;
use Espo\Core\Mail\MessageWrapper;
use Espo\Core\Utils\Log;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;

class BeforeFetch implements BeforeFetchInterface {

	public function __construct(
		protected readonly BeforeFetchHook $beforeFetchHook,
		protected readonly Log $log
	) {}

	public function process(Account $account, Message $message): BeforeFetchResult {
		$result = $this->beforeFetchHook->process($account, $message);

		$this->log->debug('Email BeforeFetch: ', [
		    'int' => $message instanceOf MessageWrapper ? ReflectionUtil::getProperty($message, 'id') : null,
		    'isFetched' => $message->isFetched(),
		    'flags' => $message->getFlags(),
		]);  

		return $result;
	}

}