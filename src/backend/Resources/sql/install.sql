-- ViaCRM Module Installation SQL
-- Creates tables for Alert and RecordTemplate entities

-- Create Alert table
CREATE TABLE IF NOT EXISTS `alert` (
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

-- Create RecordTemplate table
CREATE TABLE IF NOT EXISTS `record_template` (
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

-- Insert sample data for Alert
INSERT IGNORE INTO `alert` (`id`, `name`, `description`, `type`, `priority`, `status`, `created_at`, `is_global`) VALUES
('674c1a2b4e8f9a001', 'Welcome Alert', 'Welcome to ViaCRM module! This is a test alert to verify everything works.', 'Info', 'Normal', 'Active', NOW(), 1),
('674c1a2b4e8f9a002', 'System Update', 'System has been updated to latest version.', 'Success', 'High', 'Active', NOW(), 1),
('674c1a2b4e8f9a003', 'Maintenance Warning', 'Scheduled maintenance will occur tonight.', 'Warning', 'Normal', 'Active', NOW(), 1);

-- Insert sample data for RecordTemplate
INSERT IGNORE INTO `record_template` (`id`, `name`, `entity_type`, `description`, `data`, `is_active`, `created_at`, `is_global`) VALUES
('674c1a2b4e8f9b001', 'Basic Account Template', 'Account', 'Template for creating basic business accounts', '{"type":"Customer","industry":"Technology"}', 1, NOW(), 1),
('674c1a2b4e8f9b002', 'Lead Follow-up Template', 'Lead', 'Standard template for lead follow-up', '{"status":"New","source":"Website","rating":"Hot"}', 1, NOW(), 1),
('674c1a2b4e8f9b003', 'Meeting Template', 'Meeting', 'Default meeting setup', '{"duration":"3600","status":"Planned"}', 1, NOW(), 1);