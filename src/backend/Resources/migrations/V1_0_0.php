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
        // Create Alert table
        $this->createAlertTable();
        
        // Create RecordTemplate table
        $this->createRecordTemplateTable();
    }
    
    private function createAlertTable()
    {
        $tableName = 'alert';
        
        if ($this->schemaManager->getSchemaProxy()->hasTable($tableName)) {
            return;
        }

        $sql = "
        CREATE TABLE `alert` (
            `id` varchar(24) NOT NULL,
            `name` varchar(255) NOT NULL,
            `description` longtext,
            `type` varchar(255) DEFAULT 'Info',
            `priority` varchar(255) DEFAULT 'Normal', 
            `status` varchar(255) DEFAULT 'Draft',
            `icon_class` varchar(100) DEFAULT 'fas fa-info-circle',
            `color` varchar(7) DEFAULT '#17a2b8',
            `date_start` datetime DEFAULT NULL,
            `date_end` datetime DEFAULT NULL,
            `url` varchar(500) DEFAULT NULL,
            `is_closable` tinyint(1) DEFAULT 1,
            `is_global` tinyint(1) DEFAULT 0,
            `show_in_dashboard` tinyint(1) DEFAULT 1,
            `show_as_popup` tinyint(1) DEFAULT 0,
            `auto_close_after` int(11) DEFAULT NULL,
            `created_at` datetime DEFAULT NULL,
            `modified_at` datetime DEFAULT NULL,
            `created_by_id` varchar(24) DEFAULT NULL,
            `modified_by_id` varchar(24) DEFAULT NULL,
            `assigned_user_id` varchar(24) DEFAULT NULL,
            `deleted` tinyint(1) DEFAULT 0,
            PRIMARY KEY (`id`),
            KEY `IDX_ALERT_STATUS` (`status`),
            KEY `IDX_ALERT_DATE_RANGE` (`date_start`, `date_end`),
            KEY `IDX_ALERT_PRIORITY` (`priority`),
            KEY `IDX_ALERT_ASSIGNED_USER` (`assigned_user_id`),
            KEY `IDX_ALERT_CREATED_BY` (`created_by_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
        ";
        
        $this->entityManager->getPDO()->exec($sql);
    }
    
    private function createRecordTemplateTable()
    {
        $tableName = 'record_template';
        
        if ($this->schemaManager->getSchemaProxy()->hasTable($tableName)) {
            return;
        }

        $sql = "
        CREATE TABLE `record_template` (
            `id` varchar(24) NOT NULL,
            `name` varchar(150) NOT NULL,
            `entity_type` varchar(255) NOT NULL,
            `description` longtext,
            `data` longtext,
            `is_active` tinyint(1) DEFAULT 1,
            `is_global` tinyint(1) DEFAULT 0,
            `created_at` datetime DEFAULT NULL,
            `modified_at` datetime DEFAULT NULL,
            `created_by_id` varchar(24) DEFAULT NULL,
            `modified_by_id` varchar(24) DEFAULT NULL,
            `assigned_user_id` varchar(24) DEFAULT NULL,
            `deleted` tinyint(1) DEFAULT 0,
            PRIMARY KEY (`id`),
            KEY `IDX_RECORD_TEMPLATE_ENTITY_TYPE` (`entity_type`),
            KEY `IDX_RECORD_TEMPLATE_ENTITY_TYPE_ACTIVE` (`entity_type`, `is_active`),
            KEY `IDX_RECORD_TEMPLATE_ASSIGNED_USER` (`assigned_user_id`),
            KEY `IDX_RECORD_TEMPLATE_CREATED_BY` (`created_by_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;
        ";
        
        $this->entityManager->getPDO()->exec($sql);
    }
}