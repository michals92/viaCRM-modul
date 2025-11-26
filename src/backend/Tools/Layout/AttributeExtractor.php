<?php

namespace Espo\Modules\Viacrm\Tools\Layout;

use Espo\Core\Utils\FieldUtil;
use Espo\Core\Utils\Json;
use Espo\Tools\Layout\LayoutProvider;

class AttributeExtractor {
	public function __construct(
		private readonly LayoutProvider $layoutProvider,
		private readonly FieldUtil $fieldUtil
	) {}

	/**
	 * Extract attribute list from a layout
	 * 
	 * @param  string   $entityType
	 * @param  string   $layoutName
	 * @return string[]
	 */
	public function extractAttributesFromLayout(string $entityType, string $layoutName): array {
		$layoutJson = $this->layoutProvider->get($entityType, $layoutName);
        
		if (!$layoutJson) {
			return [];
		}
        
		try {
			$layout = Json::decode($layoutJson, true);
		} catch (\Exception $e) {
			return [];
		}
        
		if (!is_array($layout)) {
			return [];
		}
        
		// Extract field names from layout
		$fields = array_map(fn($item) => $item['name'] ?? null, $layout);
		$fields = array_filter($fields); // Remove nulls
        
		$attributes = [];
        
		// Get all attributes for each field
		foreach ($fields as $field) {
			$fieldAttributes = $this->fieldUtil->getAttributeList($entityType, $field);
			foreach ($fieldAttributes as $attribute) {
				if (!in_array($attribute, $attributes)) {
					$attributes[] = $attribute;
				}
			}
		}
        
		return $attributes;
	}
}