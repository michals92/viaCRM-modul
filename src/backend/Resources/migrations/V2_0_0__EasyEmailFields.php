<?php

namespace Espo\Modules\ViaCrm\Migrations;

class V2_0_0__EasyEmailFields extends \Espo\Core\Migration\Base
{
	public function up(): void
	{
		$pdo = $this->getEntityManager()->getPDO();

		// Add bodyMjml field to email_template table
		try {
			$sql = 'ALTER TABLE `email_template` 
                    ADD COLUMN `body_mjml` LONGTEXT NULL AFTER `body`,
                    ADD COLUMN `use_easy_email_editor` TINYINT(1) DEFAULT 0 AFTER `body_mjml`';
			$pdo->exec($sql);
			$this->log->info('Added Easy Email fields to email_template table');
		} catch (\Exception $e) {
			$this->log->warning('Failed to add fields to email_template: ' . $e->getMessage());
		}

		// Add bodyMjml field to email table
		try {
			$sql = 'ALTER TABLE `email` 
                    ADD COLUMN `body_mjml` LONGTEXT NULL AFTER `body_plain`,
                    ADD COLUMN `used_easy_email_editor` TINYINT(1) DEFAULT 0 AFTER `body_mjml`';
			$pdo->exec($sql);
			$this->log->info('Added Easy Email fields to email table');
		} catch (\Exception $e) {
			$this->log->warning('Failed to add fields to email: ' . $e->getMessage());
		}
	}

	public function down(): void
	{
		$pdo = $this->getEntityManager()->getPDO();

		// Remove fields from email_template
		try {
			$sql = 'ALTER TABLE `email_template` 
                    DROP COLUMN IF EXISTS `body_mjml`,
                    DROP COLUMN IF EXISTS `use_easy_email_editor`';
			$pdo->exec($sql);
		} catch (\Exception $e) {
			$this->log->warning('Failed to remove fields from email_template: ' . $e->getMessage());
		}

		// Remove fields from email
		try {
			$sql = 'ALTER TABLE `email` 
                    DROP COLUMN IF EXISTS `body_mjml`,
                    DROP COLUMN IF EXISTS `used_easy_email_editor`';
			$pdo->exec($sql);
		} catch (\Exception $e) {
			$this->log->warning('Failed to remove fields from email: ' . $e->getMessage());
		}
	}
}
