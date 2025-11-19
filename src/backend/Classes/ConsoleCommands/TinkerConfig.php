<?php

use Psy\Configuration;
use Psy\VersionUpdater\Checker;

return [
    // Startup message with color
    'startupMessage' => '<info>🚀 AutoCRM Tinker Console</info>' . PHP_EOL . 
                       '<comment>Available variables: $container, $entityManager, $config, $metadata</comment>' . PHP_EOL,
    
    // Theme and colors
    'theme' => 'modern',
    'colorMode' => Configuration::COLOR_MODE_AUTO,
    'useUnicode' => true,
    
    // Shell behavior
    'updateCheck' => Checker::NEVER,
    'tabCompletion' => true,
    'useBracketedPaste' => true,
    'forceArrayIndexes' => true,
    'requireSemicolons' => false,
    
    // History settings
    'historySize' => 1000,
    'eraseDuplicates' => true,
    
    // Output settings
    'verbosity' => 'normal',
];
