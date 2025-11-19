<?php

namespace Espo\Modules\Autocrm\Classes\Record\InboundEmail;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Record\Input\Data;
use Espo\Core\Record\Input\Filter;
use Espo\Core\Utils\Crypt;

/**
 * Encrypts EWS password field for InboundEmail and EmailAccount.
 *
 * This filter is appended to the core PasswordsInputFilter, which handles
 * password and smtpPassword fields. We only need to handle ewsPassword.
 */
class PasswordsInputFilter implements Filter {

	public function __construct(
		private Crypt $crypt
	) {}

	/**
	 * @throws BadRequest
	 */
	public function filter(Data $data): void {
		$ewsPassword = $data->get('ewsPassword');

		if ($ewsPassword !== null) {
			if (!is_string($ewsPassword)) {
				throw new BadRequest('EWS password must be a string.');
			}

			$data->set('ewsPassword', $this->crypt->encrypt($ewsPassword));
		}
	}

}
