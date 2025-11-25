<?php

namespace Espo\Modules\Viacrm\Core\Rebuild\Actions;

use Espo\Core\Rebuild\RebuildAction;
use Espo\Core\Utils\Config;
use Espo\Entities\Extension;
use Espo\ORM\EntityManager;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\Part\Expression as Expr;

class ReloadActiveExtensions implements RebuildAction {

	public function __construct(
		private EntityManager       $entityManager,
		private Config\ConfigWriter $configWriter,
	) {}

	public function process(): void {
		$installedExtensionsQuery = $this->entityManager
			->getQueryBuilder()
			->select(Expr::column('name'))
			->select(Expr::column('version'))
			->from(Extension::ENTITY_TYPE)
			->where(Cond::equal(
				Expr::column('isInstalled'), true
			));

		$installedExtensions = (array) $this->entityManager
			->getQueryExecutor()
			->execute($installedExtensionsQuery->build())
			->fetchAll(\PDO::FETCH_KEY_PAIR);

		$this->configWriter->set('installedExtensions', $installedExtensions);
		$this->configWriter->save();
	}

}
