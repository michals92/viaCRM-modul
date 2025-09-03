<?php

namespace Espo\Modules\ViaCrm\Scripts;

use Espo\Core\Container;
use Espo\Core\Utils\Config;
use Espo\Core\Utils\Config\ConfigWriter;

class AfterInstall
{
    private Container $container;

    public function __construct(Container $container)
    {
        $this->container = $container;
    }

    public function run(): void
    {
        $config = $this->container->getByClass(Config::class);
        $configWriter = $this->container->getByClass(ConfigWriter::class);
        
        // Get current tab list
        $tabList = $config->get('tabList') ?? [];
        
        // Entities to add to navigation
        $entitiesToAdd = ['Hr', 'Absence', 'Attendance'];
        
        $changed = false;
        foreach ($entitiesToAdd as $entity) {
            if (!in_array($entity, $tabList)) {
                $tabList[] = $entity;
                $changed = true;
            }
        }
        
        if ($changed) {
            $configWriter->set('tabList', $tabList);
            $configWriter->save();
        }
    }
}