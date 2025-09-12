<?php

namespace Espo\Modules\ViaCrm\Migrations;

use Espo\Core\Utils\Database\Schema\Utils;

class V3_0_0__OfferDiscountFields
{
    private $entityManager;
    private $schemaManager;

    public function __construct($entityManager, $schemaManager)
    {
        $this->entityManager = $entityManager;
        $this->schemaManager = $schemaManager;
    }

    public function run()
    {
        // Add discount fields to offer table
        $connection = $this->entityManager->getConnection();
        
        // Check if columns exist before adding them
        $result = $connection->executeQuery("SHOW COLUMNS FROM offer LIKE 'overall_discount_type'");
        if (!$result->fetch()) {
            $connection->executeStatement("ALTER TABLE offer ADD COLUMN overall_discount_type VARCHAR(255) DEFAULT 'percentage'");
        }
        
        $result = $connection->executeQuery("SHOW COLUMNS FROM offer LIKE 'overall_discount_value'");
        if (!$result->fetch()) {
            $connection->executeStatement("ALTER TABLE offer ADD COLUMN overall_discount_value DOUBLE DEFAULT 0");
        }
    }
}