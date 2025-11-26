<?php

namespace Espo\Modules\Viacrm\Classes\Utils;

use Espo\Core\Utils\Util;

class ObjectUtil {
	/**
	 * Ensure that a nested chain of keys exists on a given object, with optional default values.
	 *
	 * This method allows you to safely navigate and create nested object properties
	 * with optional default values for non-existent keys.
	 *
	 * @param object                   $object The object to work with.
	 * @param array<string|int, mixed> $keys   An array of keys representing the nested properties, with optional default values.
	 *
	 * @return void
	 *
	 *
	 * @example : ObjectUtil::ensureNestedKeysWithOptionalDefaults($data, [
	 *     'clientDefs',
	 *     'Project',
	 *     'menu',
	 *     'detail',
	 *     'buttons' => []
	 * ]);
	 *
	 * $data->clientDefs->Project->menu->detail->buttons[] = json_decode(<<<'JSON'
	 * {
	 *     "label": "Create goods restocks",
	 *     "name": "createGoodsRestocks",
	 *     "action": "createGoodsRestocks",
	 *     "acl": "edit",
	 *     "aclScope": "Project",
	 *     "iconHtml": "<i class=\"fas fa-person-circle-question\"></i>",
	 *     "style": "warning",
	 *     "data": {
	 *         "handler": "warehouse-management:handlers/actions/project/create-goods-restocks"
	 *     },
	 *     "initFunction": "init",
	 *     "checkVisibilityFunction": "checkVisibility"
	 * }
	 * JSON, true, 512, JSON_THROW_ON_ERROR);
	 */
	public static function ensureNestedKeysWithOptionalDefaults(object $object, array $keys): void {
		// Loop over each key in the chain.
		foreach ($keys as $key => $value) {
			// Determine if the key is numeric (simple key) or associative (key with default)
			if (is_numeric($key)) {
				$key = $value;
				$defaultValue = (object)[];
			} else {
				$defaultValue = $value;
			}

			// If the property does not exist, create it
			if (!isset($object->{$key})) {
				$object->{$key} = $defaultValue;
			} else {
				/**
				 * @noinspection NestedPositiveIfStatementsInspection
				 **/
				if (is_array($defaultValue)) {
					$object->{$key} = Util::merge((array)$object->{$key}, $defaultValue);
				} else if (is_object($defaultValue)) {
					$object->{$key} = (object)Util::merge((array)$object->{$key}, (array)$defaultValue);
				}
			}

			// Move one level deeper.
			$object = (object)$object->{$key};
		}
	}
}