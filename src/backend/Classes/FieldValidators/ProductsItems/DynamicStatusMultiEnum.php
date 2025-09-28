<?php

namespace Espo\Modules\ViaCrm\Classes\FieldValidators\ProductsItems;

use Espo\Core\FieldValidation\Validator;
use Espo\Core\FieldValidation\Validator\Data;
use Espo\Core\FieldValidation\Validator\Failure;
use Espo\Core\Utils\Metadata;
use Espo\ORM\Entity;

class DynamicStatusMultiEnum implements Validator
{
    private $metadata;

    public function __construct(Metadata $metadata)
    {
        $this->metadata = $metadata;
    }

    public function validate(Data $data): ?Failure
    {
        $entity = $data->getEntity();
        $field = $data->getField();
        $value = $entity->get($field);

        if (empty($value) || !is_array($value)) {
            return null; // Empty values are valid for non-required fields
        }

        // For dynamic status fields, always allow validation to pass
        // This allows custom statuses to be used
        return null;
    }

    private function getValidOptions(string $field): array
    {
        // Determine source entity based on field name
        if (strpos($field, 'order') !== false || strpos($field, 'Order') !== false) {
            $sourceEntity = 'Order';
        } elseif (strpos($field, 'offer') !== false || strpos($field, 'Offer') !== false) {
            $sourceEntity = 'Offer';
        } else {
            return [];
        }

        // Get options from source entity
        $options = $this->metadata->get(['entityDefs', $sourceEntity, 'fields', 'status', 'options']);

        if (!empty($options) && is_array($options)) {
            return $options;
        }

        // Fallback to static options
        $fallbackOptions = $this->metadata->get(['entityDefs', 'ProductsItems', 'fields', $field, 'options']);
        
        return $fallbackOptions ?? [];
    }
}