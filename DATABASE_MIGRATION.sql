-- ViaCRM Alert System Database Migration
-- This SQL script creates the necessary tables and relationships for the improved alert system

-- Create the AlertUser relationship table
CREATE TABLE IF NOT EXISTS alert_user (
    id INT(11) NOT NULL AUTO_INCREMENT,
    alert_id VARCHAR(17) NOT NULL,
    user_id VARCHAR(17) NOT NULL,
    alert_active TINYINT(1) DEFAULT 1,
    alert_viewed TINYINT(1) DEFAULT 0,
    created_at DATETIME NULL,
    modified_at DATETIME NULL,
    deleted TINYINT(1) DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY alert_user_unique (alert_id, user_id, deleted),
    KEY alert_id (alert_id),
    KEY user_id (user_id),
    KEY alert_active (alert_active),
    KEY alert_viewed (alert_viewed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints (optional, depending on EspoCRM configuration)
-- ALTER TABLE alert_user ADD CONSTRAINT fk_alert_user_alert FOREIGN KEY (alert_id) REFERENCES alert(id) ON DELETE CASCADE;
-- ALTER TABLE alert_user ADD CONSTRAINT fk_alert_user_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE;

-- Make sure the main alert table exists with all required fields
CREATE TABLE IF NOT EXISTS alert (
    id VARCHAR(17) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description MEDIUMTEXT NULL,
    type VARCHAR(50) DEFAULT 'Info',
    priority VARCHAR(50) DEFAULT 'Normal',
    status VARCHAR(50) DEFAULT 'Draft',
    icon_class VARCHAR(100) DEFAULT 'fas fa-info-circle',
    color VARCHAR(20) DEFAULT '#17a2b8',
    date_start DATETIME NULL,
    date_end DATETIME NULL,
    url VARCHAR(500) NULL,
    is_closable TINYINT(1) DEFAULT 1,
    is_global TINYINT(1) DEFAULT 0,
    show_in_dashboard TINYINT(1) DEFAULT 1,
    show_as_popup TINYINT(1) DEFAULT 0,
    auto_close_after INT(11) NULL,
    created_at DATETIME NULL,
    modified_at DATETIME NULL,
    created_by_id VARCHAR(17) NULL,
    modified_by_id VARCHAR(17) NULL,
    assigned_user_id VARCHAR(17) NULL,
    deleted TINYINT(1) DEFAULT 0,
    
    KEY name (name),
    KEY status (status),
    KEY date_start (date_start),
    KEY date_end (date_end),
    KEY priority (priority),
    KEY is_global (is_global),
    KEY assigned_user_id (assigned_user_id),
    KEY created_by_id (created_by_id),
    KEY created_at (created_at),
    KEY deleted (deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the AlertTeam relationship table for team-based alerts
CREATE TABLE IF NOT EXISTS alert_team (
    id INT(11) NOT NULL AUTO_INCREMENT,
    alert_id VARCHAR(17) NOT NULL,
    team_id VARCHAR(17) NOT NULL,
    deleted TINYINT(1) DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY alert_team_unique (alert_id, team_id, deleted),
    KEY alert_id (alert_id),
    KEY team_id (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing (optional)
-- INSERT INTO alert (id, name, description, type, priority, status, is_global, is_closable, created_at) 
-- VALUES ('alert_sample_001', 'Welcome to ViaCRM', 'Welcome to the improved ViaCRM alert system!', 'Info', 'Normal', 'Active', 1, 1, NOW());