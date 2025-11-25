<?php

namespace Espo\Modules\Viacrm\Services;

use Espo\Core\Currency\Converter as CurrencyConverter;
use Espo\Core\Currency\Rates as CurrencyRates;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\Field\Currency as Currency;
use Espo\Modules\Viacrm\Tools\Error\ErrorFactory;
use Espo\Modules\Viacrm\Entities\Product as ProductEntity;
use Espo\Modules\Viacrm\Entities\TaxClass;

class Product extends \Espo\Core\Templates\Services\Base
{
    /**
     * Get attributes for product selection with optional account auto-fill.
     *
     * @param string      $productId
     * @param string|null $existingAccountId
     *
     * @throws NotFound
     *
     * @return array<string, mixed>
     */
    public function getSelectAttributes(string $productId, ?string $existingAccountId): array
    {
        $em = $this->entityManager;
        $product = $em->getEntityById(ProductEntity::ENTITY_TYPE, $productId);

        if (!$product) {
            throw new NotFound('Product not found');
        }

        $attributes = [
            'productId' => $product->getId(),
            'productName' => $product->get('name'),
        ];

        // If target record already has accountId set, don't auto-fill
        if ($existingAccountId) {
            return $attributes;
        }

        // Auto-fill accountId from ProductSupplierItem if there's exactly one
        /** @var \Espo\ORM\EntityCollection<\Espo\ORM\Entity> $productSupplierItems */
        $productSupplierItems = $em->getRelation($product, 'productSupplierItems')
            ->select(['id', 'accountId', 'accountName'])
            ->find();

        if (count($productSupplierItems) === 1) {
            $supplierItem = iterator_to_array($productSupplierItems)[0];
            $attributes['accountId'] = $supplierItem->get('accountId');
            $attributes['accountName'] = $supplierItem->get('accountName');
        }

        return $attributes;
    }

    /**
     * Calculate product pricing based on pricing type.
     *
     * @param array<string, mixed> $options
     */
    public function calculatePricing(ProductEntity $entity, array $options = []): void
    {
        if (!empty($options['skipPriceCalculation'])) {
            return;
        }

        $pricingType = $entity->getPricingType();

        /** @var ?TaxClass $taxClass */
        $taxClass = $this
            ->entityManager
            ->getRelation($entity, 'taxClass')
            ->findOne();

        if ($taxClass) {
            $entity->setTaxRate($taxClass->getRate());
        }

        $taxRate = $entity->getTaxRate();

        switch ($pricingType) {
            case ProductEntity::PRICING_TYPE_FIXED:
                $this->calculateFixedPricing($entity);
                break;
            case ProductEntity::PRICING_TYPE_MARKUP:
                $this->calculateMarkupPricing($entity);
                break;
            case ProductEntity::PRICING_TYPE_MARGIN:
                $this->calculateMarginPricing($entity);
                break;
            case ProductEntity::PRICING_TYPE_SAME_AS_COST:
                $this->calculateSameAsCostPricing($entity);
                break;
            case ProductEntity::PRICING_TYPE_PURCHASING_COEFFICIENT:
                $this->calculatePurchasingCoefficientPricing($entity);
                break;
            case ProductEntity::PRICING_TYPE_SALES_COEFFICIENT:
                $this->calculateSalesCoefficientPricing($entity);
                break;
            default:
                $this->clearPricing($entity);
        }

        $this->calculateTaxPrices($entity, $taxRate);
    }

    /**
     * Convert a currency value to a target currency using Viacrm settings rates if available,
     * otherwise fall back to global currency rates. Returns original value if conversion is not needed/possible.
     */
    protected function convertCurrencyTo(?Currency $value, ?string $targetCode): ?Currency
    {
        if ($value === null || $targetCode === null || $value->getCode() === $targetCode) {
            return $value;
        }

        /** @var CurrencyConverter $converter */
        $converter = $this->injectableFactory->create(CurrencyConverter::class);

        // Try Viacrm-specific rates first (set in Settings as `productCurrencyRates`), else fallback.
        $baseCurrency = $this->config->get('baseCurrency');
        $productRates = $this->config->get('productCurrencyRates');

        try {
            if (is_array($productRates) && $baseCurrency) {
                $assoc = [$baseCurrency => 1.0] + $productRates;
                $rates = CurrencyRates::fromAssoc($assoc, $baseCurrency);

                return $converter->convertWithRates($value, $targetCode, $rates);
            }

            // Fallback to global rates
            return $converter->convert($value, $targetCode);
        } catch (\Throwable $e) {
            // If conversion fails for any reason, keep original for backward compatibility.
            return $value;
        }
    }

    /**
     * Calculate fixed pricing.
     */
    protected function calculateFixedPricing(ProductEntity $entity): void
    {
        $salesPrice = $entity->getSalesPrice();
        $salesPriceAmount = $salesPrice?->getAmount();

        if ($salesPriceAmount === null) {
            throw ErrorFactory::createBadRequest(
                'Sales Price is required for Fixed Sales Price pricing type.',
                'salesPriceRequiredForFixedSalesPrice',
                ProductEntity::ENTITY_TYPE
            );
        }

        $costPrice = $entity->getCostPrice();

        // Convert cost to the sales currency (if different) to compute markup/margin correctly.
        $costForCalc = $costPrice;
        $targetSalesCode = $salesPrice->getCode();
        if ($costForCalc !== null) {
            $costForCalc = $this->convertCurrencyTo($costForCalc, $targetSalesCode);
        }

        $costPriceAmount = $costForCalc?->getAmount();
        $markup = null;
        $margin = null;

        if ($costPriceAmount !== null) {
            if ($salesPriceAmount === 0.0 && $costPriceAmount === 0.0) {
                $markup = 0;
                $margin = 0;
            } else {
                if ($costPriceAmount !== 0.0) {
                    $markup = ($salesPriceAmount - $costPriceAmount) / $costPriceAmount * 100;
                }

                if ($salesPriceAmount !== 0.0) {
                    $margin = ($salesPriceAmount - $costPriceAmount) / $salesPriceAmount * 100;
                }
            }
        }

        $entity->setPriceMarkup($markup);
        $entity->setPriceMargin($margin);
    }

    /**
     * Calculate markup pricing.
     */
    protected function calculateMarkupPricing(ProductEntity $entity): void
    {
        $markup = $entity->getPriceMarkup();

        if ($markup === null) {
            throw ErrorFactory::createBadRequest(
                'Markup is required for Markup over Cost pricing type.',
                'markupRequiredForMarkupOverCost',
                ProductEntity::ENTITY_TYPE
            );
        }

        $costPrice = $entity->getCostPrice();
        if ($costPrice === null) {
            throw ErrorFactory::createBadRequest(
                'Cost Price is required for Markup over Cost pricing type.',
                'costPriceRequiredForMarkupOverCost',
                ProductEntity::ENTITY_TYPE
            );
        }

        $markup /= 100;

        // Calculate in cost currency then convert to desired sales currency if set.
        $computedSales = $costPrice->multiply(1 + $markup);
        $targetCode = $entity->get('salesPriceCurrency') ?? $computedSales->getCode();
        $computedSales = $this->convertCurrencyTo($computedSales, $targetCode) ?? $computedSales;

        $entity->setSalesPrice($computedSales);
        $entity->setPriceMargin($markup / (1 + $markup) * 100);
    }

    /**
     * Calculate margin pricing.
     */
    protected function calculateMarginPricing(ProductEntity $entity): void
    {
        $margin = $entity->getPriceMargin();

        if ($margin === null) {
            throw ErrorFactory::createBadRequest(
                'Margin is required for Profit Margin pricing type.',
                'marginRequiredForProfitMargin',
                ProductEntity::ENTITY_TYPE
            );
        }

        $costPrice = $entity->getCostPrice();
        if ($costPrice === null) {
            throw ErrorFactory::createBadRequest(
                'Cost Price is required for Profit Margin pricing type.',
                'costPriceRequiredForProfitMargin',
                ProductEntity::ENTITY_TYPE
            );
        }

        $margin /= 100;

        // Calculate in cost currency then convert to desired sales currency if set.
        $computedSales = $costPrice->divide(1 - $margin);
        $targetCode = $entity->get('salesPriceCurrency') ?? $computedSales->getCode();
        $computedSales = $this->convertCurrencyTo($computedSales, $targetCode) ?? $computedSales;

        $entity->setSalesPrice($computedSales);
        $entity->setPriceMarkup($margin / (1 - $margin) * 100);
    }

    /**
     * Calculate same as cost pricing.
     */
    protected function calculateSameAsCostPricing(ProductEntity $entity): void
    {
        $price = $entity->getCostPrice();
        if ($price !== null) {
            $targetCode = $entity->get('salesPriceCurrency') ?? $price->getCode();
            $price = $this->convertCurrencyTo($price, $targetCode) ?? $price;
        }

        $entity->setSalesPrice($price);
        $entity->setPriceMarkup(0);
        $entity->setPriceMargin(0);
    }

    /**
     * Calculate purchasing coefficient pricing.
     */
    protected function calculatePurchasingCoefficientPricing(ProductEntity $entity): void
    {
        $costPrice = $entity->getCostPrice();
        $coefficient = $entity->getCoefficient();
        if ($costPrice !== null && $coefficient !== null) {
            $entity->setCostPrice($costPrice->multiply($coefficient));
        }
    }

    /**
     * Calculate sales coefficient pricing.
     */
    protected function calculateSalesCoefficientPricing(ProductEntity $entity): void
    {
        $costPrice = $entity->getCostPrice();
        $coefficient = $entity->getCoefficient();
        if ($costPrice !== null && $coefficient !== null) {
            $computedSales = $costPrice->multiply($coefficient);
            $targetCode = $entity->get('salesPriceCurrency') ?? $computedSales->getCode();
            $computedSales = $this->convertCurrencyTo($computedSales, $targetCode) ?? $computedSales;

            $entity->setSalesPrice($computedSales);
        }
    }

    /**
     * Clear pricing values.
     */
    protected function clearPricing(ProductEntity $entity): void
    {
        $entity->setSalesPrice(null);
        $entity->setPriceMarkup(null);
        $entity->setPriceMargin(null);
    }

    /**
     * Calculate tax-inclusive prices.
     */
    protected function calculateTaxPrices(ProductEntity $entity, ?float $taxRate): void
    {
        $taxCoeff = 1 + ($taxRate ?? 0) / 100;

        $entity->setSalesPriceWithTax($entity->getSalesPrice()?->multiply($taxCoeff));
        $entity->setCostPriceWithTax($entity->getCostPrice()?->multiply($taxCoeff));
    }

    /**
     * Get default warehouse for the product.
     */
    public function getDefaultWarehouse(ProductEntity $product): ?\Espo\ORM\Entity
    {
        return $this->entityManager
            ->getRelation($product, 'defaultWarehouse')
            ->findOne();
    }

    /**
     * Get default warehouse position for the product.
     */
    public function getDefaultWarehousePosition(ProductEntity $product): ?\Espo\ORM\Entity
    {
        return $this->entityManager
            ->getRelation($product, 'defaultWarehousePosition')
            ->findOne();
    }
}
