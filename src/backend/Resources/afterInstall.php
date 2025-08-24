<?php
// ViaCRM Module Post-Install Script

use Espo\Core\Container;

class AfterInstall 
{
    private $container;

    public function run(Container $container)
    {
        $this->container = $container;
        
        try {
            // Create sample data
            $this->createSampleAlerts();
            $this->createSampleTemplates();
            
            // Log success
            $GLOBALS['log']->info('ViaCRM: Post-install completed successfully');
            
        } catch (Exception $e) {
            $GLOBALS['log']->error('ViaCRM Post-install error: ' . $e->getMessage());
        }
    }
    
    private function createSampleAlerts()
    {
        $entityManager = $this->container->get('entityManager');
        
        // Check if Alert entity exists
        if (!$entityManager->hasRepository('Alert')) {
            return;
        }
        
        $repository = $entityManager->getRepository('Alert');
        
        // Create sample alerts if none exist
        $existing = $repository->where(['deleted' => false])->findOne();
        if ($existing) {
            return; // Already have data
        }
        
        $alerts = [
            [
                'name' => 'Welcome to ViaCRM',
                'description' => 'Welcome to the ViaCRM module! This alert system helps you manage important notifications.',
                'type' => 'Info',
                'priority' => 'Normal',
                'status' => 'Active',
                'isGlobal' => true,
                'isClosable' => true
            ],
            [
                'name' => 'Module Installed Successfully', 
                'description' => 'The ViaCRM module has been installed and configured successfully.',
                'type' => 'Success',
                'priority' => 'High', 
                'status' => 'Active',
                'isGlobal' => true,
                'isClosable' => true
            ]
        ];
        
        foreach ($alerts as $alertData) {
            try {
                $alert = $entityManager->createEntity('Alert', $alertData);
                $GLOBALS['log']->info('ViaCRM: Created sample alert: ' . $alert->get('name'));
            } catch (Exception $e) {
                $GLOBALS['log']->error('ViaCRM: Failed to create alert: ' . $e->getMessage());
            }
        }
    }
    
    private function createSampleTemplates()
    {
        $entityManager = $this->container->get('entityManager');
        
        // Check if RecordTemplate entity exists
        if (!$entityManager->hasRepository('RecordTemplate')) {
            return;
        }
        
        $repository = $entityManager->getRepository('RecordTemplate');
        
        // Create sample templates if none exist
        $existing = $repository->where(['deleted' => false])->findOne();
        if ($existing) {
            return; // Already have data
        }
        
        $templates = [
            [
                'name' => 'Basic Account Template',
                'entityType' => 'Account',
                'description' => 'Template for creating standard business accounts',
                'data' => json_encode([
                    'type' => 'Customer',
                    'industry' => 'Technology'
                ]),
                'isActive' => true,
                'isGlobal' => true
            ],
            [
                'name' => 'Hot Lead Template',
                'entityType' => 'Lead',
                'description' => 'Template for high-priority leads',
                'data' => json_encode([
                    'status' => 'New',
                    'source' => 'Website',
                    'rating' => 'Hot'
                ]),
                'isActive' => true,
                'isGlobal' => true
            ]
        ];
        
        foreach ($templates as $templateData) {
            try {
                $template = $entityManager->createEntity('RecordTemplate', $templateData);
                $GLOBALS['log']->info('ViaCRM: Created sample template: ' . $template->get('name'));
            } catch (Exception $e) {
                $GLOBALS['log']->error('ViaCRM: Failed to create template: ' . $e->getMessage());
            }
        }
    }
}