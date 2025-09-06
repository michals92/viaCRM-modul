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
        $entitiesToAdd = ['Hr', 'Absence', 'Attendance', 'Offer', 'ProductsItems'];
        
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
        
        // Reset Offer layouts to force using module defaults
        $this->resetEntityLayouts('Offer');
        
        // Clear layout cache
        $this->clearLayoutCache();
    }
    
    private function resetEntityLayouts(string $entityType): void
    {
        try {
            $entityManager = $this->container->getByClass('Espo\\Core\\ORM\\EntityManager');
            
            // Remove custom layouts from database to force using module defaults
            $layoutRecords = $entityManager
                ->getRDBRepository('Layout')
                ->where('name', $entityType)
                ->find();
                
            foreach ($layoutRecords as $layout) {
                $entityManager->removeEntity($layout);
            }
            
        } catch (\Exception $e) {
            // Silently continue if there's an error
            error_log("Could not reset layouts for $entityType: " . $e->getMessage());
        }
    }
    
    private function clearLayoutCache(): void
    {
        try {
            $fileManager = $this->container->getByClass('Espo\\Core\\Utils\\File\\Manager');
            $config = $this->container->getByClass(Config::class);
            
            $cacheDir = $config->get('cacheDir', 'data/cache');
            $layoutCacheDir = $cacheDir . '/application/layouts';
            
            if ($fileManager->isDir($layoutCacheDir)) {
                $fileManager->removeInDir($layoutCacheDir, true);
            }
        } catch (\Exception $e) {
            error_log("Could not clear layout cache: " . $e->getMessage());
        }
    }
}