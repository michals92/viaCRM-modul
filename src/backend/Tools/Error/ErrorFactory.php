<?php

namespace Espo\Modules\Viacrm\Tools\Error;

use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Error\Body as ErrorBody;
use Espo\Core\Exceptions\ErrorSilent;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\FieldValidation\Exceptions\ValidationError;

class ErrorFactory
{
	/**
	 * Create a standard Error with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @return Error
	 */
	public static function createError(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): Error {
		return Error::createWithBody(
			$message,
			ErrorBody::create()
				->withMessageTranslation(
					$translationKey,
					$scope,
					$data
				)
				->encode()
		);
	}

	/**
	 * Create and throw a standard Error with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @throws Error
	 *
	 * @return never
	 */
	public static function throwError(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): never {
		throw self::createError($message, $translationKey, $scope, $data);
	}

	/**
	 * Create a BadRequest error with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @return BadRequest
	 */
	public static function createBadRequest(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): BadRequest {
		return BadRequest::createWithBody(
			$message,
			ErrorBody::create()
				->withMessageTranslation(
					$translationKey,
					$scope,
					$data
				)
				->encode()
		);
	}

	/**
	 * Create and throw a BadRequest error with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @throws BadRequest
	 *
	 * @return never
	 */
	public static function throwBadRequest(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): never {
		throw self::createBadRequest($message, $translationKey, $scope, $data);
	}

	/**
	 * Create a Forbidden error with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @return Forbidden
	 */
	public static function createForbidden(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): Forbidden {
		return Forbidden::createWithBody(
			$message,
			ErrorBody::create()
				->withMessageTranslation(
					$translationKey,
					$scope,
					$data
				)
				->encode()
		);
	}

	/**
	 * Create and throw a Forbidden error with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @throws Forbidden
	 *
	 * @return never
	 */
	public static function throwForbidden(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): never {
		throw self::createForbidden($message, $translationKey, $scope, $data);
	}

	/**
	 * Create a NotFound error.
	 *
	 * Note: Unlike other error types, NotFound does not support the createWithBody method
	 * for translations. This method only uses the message parameter.
	 *
	 * @param ?string                   $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @return NotFound
	 */
	public static function createNotFound(
		?string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): NotFound {
		$message ??= ErrorBody::create()
			->withMessageTranslation(
				$translationKey,
				$scope,
				$data
			)
			->encode();

		return new NotFound($message);
	}

	/**
	 * Create and throw a NotFound error.
	 *
	 * Note: Unlike other error types, NotFound does not support the createWithBody method
	 * for translations. This method only uses the message parameter.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @throws NotFound
	 *
	 * @return never
	 */
	public static function throwNotFound(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): never {
		throw self::createNotFound($message, $translationKey, $scope, $data);
	}

	/**
	 * Create a Silent error with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @return Error
	 */
	public static function createSilent(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): Error {
		return ErrorSilent::createWithBody(
			$message,
			ErrorBody::create()
				->withMessageTranslation(
					$translationKey,
					$scope,
					$data
				)
				->encode()
		);
	}

	/**
	 * Create and throw a Silent error with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @throws Error
	 *
	 * @return never
	 */
	public static function throwSilent(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): never {
		throw self::createSilent($message, $translationKey, $scope, $data);
	}

	/**
	 * Create a ValidationError with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @return ValidationError
	 */
	public static function createValidationError(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): ValidationError {
		return ValidationError::createWithBody(
			$message,
			ErrorBody::create()
				->withMessageTranslation(
					$translationKey,
					$scope,
					$data
				)
		);
	}

	/**
	 * Create and throw a ValidationError with translation.
	 *
	 * @param string                    $message        The error message in English
	 * @param string                    $translationKey The translation key for the error message
	 * @param string|null               $scope          The translation scope/category
	 * @param array<string, mixed>|null $data           Parameters for the translation
	 *
	 * @throws ValidationError
	 *
	 * @return never
	 */
	public static function throwValidationError(
		string $message,
		string $translationKey,
		?string $scope = null,
		?array $data = null
	): never {
		throw self::createValidationError($message, $translationKey, $scope, $data);
	}
}
