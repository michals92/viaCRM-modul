<?php

namespace Espo\Modules\Viacrm\Entities;

use Espo\Core\Field\Currency;

class Product extends \Espo\Core\Templates\Entities\Base
{
    public const string TEMPLATE_TYPE = 'Base';

    public const string ENTITY_TYPE = 'Product';

    public const PRICING_TYPE_NO_PRICE = 'No Price';
    public const PRICING_TYPE_FIXED = 'Fixed Sales Price';
    public const PRICING_TYPE_MARKUP = 'Markup over Cost';
    public const PRICING_TYPE_MARGIN = 'Profit Margin';
    public const PRICING_TYPE_SAME_AS_COST = 'Same as Cost Price';
    public const PRICING_TYPE_PURCHASING_COEFFICIENT = 'Purchasing Coefficient';
    public const PRICING_TYPE_SALES_COEFFICIENT = 'Sales Coefficient';

    public function setPricingType(string $pricingType): void
    {
        $this->set('pricingType', $pricingType);
    }

    public function setSalesPrice(?Currency $salesPrice): void
    {
        $this->setValueObject('salesPrice', $salesPrice);
    }

    public function setPriceMarkup(?float $markup): void
    {
        $this->set('priceMarkup', $markup);
    }

    public function setPriceMargin(?float $margin): void
    {
        $this->set('priceMargin', $margin);
    }

    public function setCostPrice(?Currency $costPrice): void
    {
        $this->setValueObject('costPrice', $costPrice);
    }

    public function setCostPriceWithTax(?Currency $costPriceWithTax): void
    {
        $this->setValueObject('costPriceWithTax', $costPriceWithTax);
    }

    public function setTaxRate(float $taxRate): void
    {
        $this->set('taxRate', $taxRate);
    }

    public function getPricingType(): string
    {
        return $this->get('pricingType');
    }

    public function getSalesPrice(): ?Currency
    {
        /** @var ?Currency */
        return $this->getValueObject('salesPrice');
    }

    public function getSalesPriceWithTax(): ?Currency
    {
        /** @var ?Currency */
        return $this->getValueObject('salesPriceWithTax');
    }

    public function setSalesPriceWithTax(?Currency $salesPriceWithTax): void
    {
        $this->setValueObject('salesPriceWithTax', $salesPriceWithTax);
    }

    public function getPriceMarkup(): ?float
    {
        return $this->get('priceMarkup');
    }

    public function getWeight(): ?float
    {
        return $this->get('weight');
    }

    public function getPriceMargin(): ?float
    {
        return $this->get('priceMargin');
    }

    public function getCostPrice(): ?Currency
    {
        /** @var ?Currency */
        return $this->getValueObject('costPrice');
    }

    public function getCostPriceWithTax(): ?Currency
    {
        /** @var ?Currency */
        return $this->getValueObject('costPriceWithTax');
    }

    public function getTaxRate(): float
    {
        return $this->get('taxRate') ?? 0.0;
    }

    public function getType(): string
    {
        return $this->get('type');
    }

    public function getCoefficient(): ?float
    {
        return $this->get('coefficient');
    }

    public function getName(): string
    {
        return $this->get('name');
    }
}
