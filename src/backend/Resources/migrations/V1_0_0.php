<?php

namespace Espo\Modules\ViaCrm\Migrations;

use Espo\Core\Utils\Database\Schema\Utils;

class V1_0_0
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
        // Migration V1_0_0 - base module setup
        // Alert and RecordTemplate entities have been removed
    }
}