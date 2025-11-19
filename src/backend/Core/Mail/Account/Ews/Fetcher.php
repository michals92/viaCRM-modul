<?php

namespace Espo\Modules\Autocrm\Core\Mail\Account\Ews;

use Espo\Core\Exceptions\Error;
use Espo\Core\Mail\Importer;
use Espo\Core\Mail\Importer\Data as ImporterData;
use Espo\Core\Mail\MessageWrapper;
use Espo\Core\Mail\ParserFactory;
use Espo\Core\Utils\Log;
use Espo\Entities\Email;
use Espo\Modules\Autocrm\Core\Mail\Account\Ews\GroupAccount\Account as GroupAccountAccount;
use Espo\Modules\Autocrm\Core\Mail\Account\Ews\PersonalAccount\Account as PersonalAccountAccount;
use Throwable;

/**
 * Lightweight EWS fetcher based on SOAP requests (FindItem + GetItem).
 */
class Fetcher {

	public function __construct(
		private Importer $importer,
		private Log $log,
		private ParserFactory $parserFactory
	) {}

	/**
	 * @throws Error
	 */
	public function fetch(PersonalAccountAccount|GroupAccountAccount $account): void {
		if (!$account->isAvailableForFetching()) {
			throw new Error("{$account->getEntityType()} {$account->getId()} is not active.");
		}

		$serverUrl = trim((string) $account->getEwsServerUrl());
		$userName = $account->getEwsUserName();
		$password = $account->getEwsPassword();

		if (!$serverUrl || !$userName || !$password) {
			throw new Error("EWS credentials are incomplete for account {$account->getId()}");
		}

		$portionLimit = max(1, $account->getPortionLimit());
		$fetchData = $account->getFetchData();
		$lastProcessedDate = $fetchData->getLastProcessedDate();
		$lastTimestamp = null;

		if ($lastProcessedDate) {
			$parsedTime = strtotime($lastProcessedDate);
			$lastTimestamp = $parsedTime !== false ? $parsedTime : null;
		}

		$newestTimestamp = $lastTimestamp;
		$importedCount = 0;

		try {
			$items = $this->findItems($serverUrl, $userName, $password, $portionLimit);

			// Process oldest first.
			usort($items, static fn ($a, $b) => strcmp($a['received'], $b['received']));

			foreach ($items as $item) {
				$receivedTs = strtotime($item['received']);

				if ($lastTimestamp && $receivedTs !== false && $receivedTs <= $lastTimestamp) {
					continue;
				}

				$mimeContent = $this->getItemMime(
					$serverUrl,
					$userName,
					$password,
					$item['id'],
					$item['changeKey']
				);

				if (!$mimeContent) {
					continue;
				}

				try {
					$parser = $this->parserFactory->create();
					$message = new MessageWrapper(0, null, $parser, $mimeContent);
					$email = $this->importer->import($message, $this->createImporterData($account));

					if ($email instanceof Email) {
						$account->relateEmail($email);
						$importedCount++;
					}
				} catch (Throwable $e) {
					$this->log->error("EWS: Failed to import message {$item['id']}: {$e->getMessage()}");
					continue;
				}

				if ($receivedTs !== false) {
					$newestTimestamp = max($newestTimestamp ?? $receivedTs, $receivedTs);
				}
			}

			if ($newestTimestamp !== null && $newestTimestamp !== $lastTimestamp) {
				$fetchData = $fetchData->withLastProcessedDate(gmdate('c', $newestTimestamp));
				$account->updateFetchData($fetchData);
			}

			$account->updateConnectedAt();

			$this->log->info("EWS: Imported {$importedCount} messages for account {$account->getId()}");
		} catch (Throwable $e) {
			$this->log->error("EWS: Fetch error for account {$account->getId()}: {$e->getMessage()}");

			throw new Error("EWS fetch failed: {$e->getMessage()}", 0, $e);
		}
	}

	/**
	 * @throws Error
	 * @return array<int, array{id:string, changeKey:string, received:string}>
	 */
	private function findItems(string $url, string $username, string $password, int $limit): array {
		$body = $this->buildFindItemEnvelope($limit);
		$response = $this->sendSoapRequest($url, $username, $password, 'FindItem', $body);

		$this->ensureResponseSuccess($response, 'FindItem');

		$items = [];

		if (!preg_match_all('/<t:Message>(.*?)<\/t:Message>/s', $response, $matches)) {
			return $items;
		}

		foreach ($matches[1] as $block) {
			if (!preg_match('/<t:ItemId[^>]*Id="([^"]+)"[^>]*ChangeKey="([^"]+)"/', $block, $idMatch)) {
				continue;
			}

			$received = '';

			if (preg_match('/<t:DateTimeReceived>([^<]*)<\/t:DateTimeReceived>/', $block, $dateMatch)) {
				$received = $dateMatch[1];
			}

			$items[] = [
			    'id' => html_entity_decode($idMatch[1]),
			    'changeKey' => html_entity_decode($idMatch[2]),
			    'received' => $received,
			];
		}

		return $items;
	}

	/**
	 * @throws Error
	 */
	private function getItemMime(
		string $url,
		string $username,
		string $password,
		string $itemId,
		string $changeKey
	): ?string {
		$body = $this->buildGetItemEnvelope($itemId, $changeKey);
		$response = $this->sendSoapRequest($url, $username, $password, 'GetItem', $body);

		$this->ensureResponseSuccess($response, 'GetItem');

		if (!preg_match('/<t:MimeContent[^>]*>([^<]+)<\/t:MimeContent>/', $response, $match)) {
			$this->log->warning("EWS: No MIME content for message {$itemId}");

			return null;
		}

		$base64 = preg_replace('/\s+/', '', $match[1]);

		if ($base64 === null) {
			$this->log->warning("EWS: Failed to process MIME content for message {$itemId}");

			return null;
		}

		$mimeContent = base64_decode($base64, true);

		if ($mimeContent === false) {
			$this->log->warning("EWS: Failed to decode MIME content for message {$itemId}");

			return null;
		}

		return $mimeContent;
	}

	/**
	 * @throws Error
	 */
	private function sendSoapRequest(
		string $url,
		string $username,
		string $password,
		string $action,
		string $body
	): string {
		$ch = curl_init($url);

		curl_setopt_array($ch, [
		    CURLOPT_POST => true,
		    CURLOPT_POSTFIELDS => $body,
		    CURLOPT_RETURNTRANSFER => true,
		    CURLOPT_HTTPAUTH => CURLAUTH_BASIC | CURLAUTH_NTLM,
		    CURLOPT_USERPWD => $username . ':' . $password,
		    CURLOPT_HTTPHEADER => [
		        'Content-Type: text/xml; charset=utf-8',
		        'SOAPAction: http://schemas.microsoft.com/exchange/services/2006/messages/' . $action,
		    ],
		    CURLOPT_SSL_VERIFYPEER => false,
		    CURLOPT_SSL_VERIFYHOST => false,
		]);

		$response = curl_exec($ch);
		$error = curl_error($ch);
		$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
		curl_close($ch);

		if ($response === false) {
			throw new Error("cURL error: {$error}");
		}

		assert(is_string($response));

		if ($status >= 400) {
			throw new Error("EWS HTTP {$status} response for {$action}");
		}

		return $response;
	}

	private function buildFindItemEnvelope(int $limit): string {
		$max = max(1, $limit);

		return <<<XML
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">
  <soap:Header>
    <t:RequestServerVersion Version="Exchange2013" />
  </soap:Header>
  <soap:Body>
    <m:FindItem Traversal="Shallow">
      <m:ItemShape>
        <t:BaseShape>IdOnly</t:BaseShape>
      </m:ItemShape>
      <m:IndexedPageItemView MaxEntriesReturned="{$max}" Offset="0" BasePoint="Beginning" />
      <m:SortOrder>
        <t:FieldOrder Order="Descending">
          <t:FieldURI FieldURI="item:DateTimeReceived"/>
        </t:FieldOrder>
      </m:SortOrder>
      <m:ParentFolderIds>
        <t:DistinguishedFolderId Id="inbox"/>
      </m:ParentFolderIds>
    </m:FindItem>
  </soap:Body>
</soap:Envelope>
XML;
	}

	private function buildGetItemEnvelope(string $itemId, string $changeKey): string {
		$itemIdEscaped = htmlspecialchars($itemId, ENT_XML1);
		$changeKeyEscaped = htmlspecialchars($changeKey, ENT_XML1);

		return <<<XML
<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:t="http://schemas.microsoft.com/exchange/services/2006/types"
               xmlns:m="http://schemas.microsoft.com/exchange/services/2006/messages">
  <soap:Header>
    <t:RequestServerVersion Version="Exchange2013" />
  </soap:Header>
  <soap:Body>
    <m:GetItem>
      <m:ItemShape>
        <t:BaseShape>AllProperties</t:BaseShape>
        <t:IncludeMimeContent>true</t:IncludeMimeContent>
        <t:BodyType>Best</t:BodyType>
      </m:ItemShape>
      <m:ItemIds>
        <t:ItemId Id="{$itemIdEscaped}" ChangeKey="{$changeKeyEscaped}"/>
      </m:ItemIds>
    </m:GetItem>
  </soap:Body>
</soap:Envelope>
XML;
	}

	private function ensureResponseSuccess(string $response, string $action): void {
		if (!preg_match('/<m:ResponseCode>([^<]+)<\/m:ResponseCode>/', $response, $match)) {
			$this->log->warning("EWS {$action} response has no ResponseCode");

			return;
		}

		$code = $match[1];

		if ($code !== 'NoError') {
			throw new Error("EWS {$action} response: {$code}");
		}
	}

	private function createImporterData(PersonalAccountAccount|GroupAccountAccount $account): ImporterData {
		$data = ImporterData::create();

		if ($account->getAssignedUser()) {
			$data = $data->withAssignedUserId($account->getAssignedUser()->getId());
		}

		$teams = $account->getTeams();

		if (count($teams->getIdList())) {
			$data = $data->withTeamIdList($teams->getIdList());
		}

		$users = $account->getUsers();

		if (count($users->getIdList())) {
			$data = $data->withUserIdList($users->getIdList());
		}

		if ($account->getEmailFolder()) {
			$data = $data->withFolderData([
			    $account->getEmailFolder()->getId() => 'all',
			]);
		}

		return $data;
	}

}
