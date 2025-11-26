<?php

namespace Espo\Modules\Viacrm\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Di;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Error;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Exceptions\NotFound;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Json;
use Espo\Modules\Viacrm\Classes\Utils\ReflectionUtil;
use Espo\Modules\Viacrm\Tools\LinkManager\LinkManager;
use Espo\Tools\EntityManager\EntityManager as EntityManagerTool;
use ReflectionClass;
use stdClass;

class EntityManager extends \Espo\Controllers\EntityManager implements
	Di\MetadataAware,
	Di\FileManagerAware,
	Di\LanguageAware,
	Di\DataManagerAware,
	Di\InjectableFactoryAware {
	use Di\MetadataSetter;
	use Di\FileManagerSetter;
	use Di\LanguageSetter;
	use Di\DataManagerSetter;
	use Di\InjectableFactorySetter;

	public function __construct(
		InjectableFactory $injectableFactory
	) {
		$parentConstructorArgs = ReflectionUtil::callMethod(
			$injectableFactory,
			'getConstructorInjectionList',
			new ReflectionClass(parent::class)
		);

		parent::__construct(...$parentConstructorArgs);
	}

	private function getLinkManager(): LinkManager {
		/** @var LinkManager $linkManager */
		$linkManager = ReflectionUtil::getClassProperty(parent::class, $this, 'linkManager');

		return $linkManager;
	}

	/**
	 * @throws BadRequest
	 * @throws Error
	 * @throws Forbidden
	 */
	public function postActionCloneEntity(Request $request): stdClass {
		$data = $request->getParsedBody();

		/** @var EntityManagerTool $entityManagerTool */
		$entityManagerTool = ReflectionUtil::getClassProperty(parent::class, $this, 'entityManagerTool');
        
		if (empty($data->sourceEntityType)) {
			throw new BadRequest('No sourceEntityType provided');
		}
        
		if (empty($data->name)) {
			throw new BadRequest('No name provided');
		}
        
		$sourceEntityType = $data->sourceEntityType;
		$newName = $data->name;
        
		if (!is_string($sourceEntityType) || !is_string($newName)) {
			throw new BadRequest('Invalid parameters');
		}
        
		// Check if source entity exists
		if (!$this->metadata->get(['scopes', $sourceEntityType])) {
			throw new NotFound('Source entity type not found');
		}
        
		// Check if target entity already exists
		if ($this->metadata->get(['scopes', $newName])) {
			throw new BadRequest("Entity with name '{$newName}' already exists");
		}
        
		// Get source entity metadata
		$scopeData = $this->metadata->get(['scopes', $sourceEntityType], []);
		$entityDefsData = $this->metadata->get(['entityDefs', $sourceEntityType], []);
		$clientDefsData = $this->metadata->get(['clientDefs', $sourceEntityType]);
		$selectDefsData = $this->metadata->get(['selectDefs', $sourceEntityType]);
		$recordDefsData = $this->metadata->get(['recordDefs', $sourceEntityType]);
		$aclDefsData = $this->metadata->get(['aclDefs', $sourceEntityType]);
        
		// Get entity type
		$type = $data->type ?? $scopeData['type'] ?? 'Base';
        
		// Prepare params for creation
		$params = [];
        
		// Use provided labels or defaults
		$params['labelSingular'] = $data->labelSingular ?? $newName;
		$params['labelPlural'] = $data->labelPlural ?? $newName;
        
		// Copy basic parameters
		if (isset($data->stream)) {
			$params['stream'] = (bool) $data->stream;
		} elseif (!empty($scopeData['stream'])) {
			$params['stream'] = true;
		}
        
		// Always start enabled
		$params['disabled'] = false;
        
		// Copy visual parameters
		if (!empty($data->color)) {
			$params['color'] = $data->color;
		} elseif (!empty($clientDefsData['color'])) {
			$params['color'] = $clientDefsData['color'];
		}
        
		if (!empty($data->iconClass)) {
			$params['iconClass'] = $data->iconClass;
		} elseif (!empty($clientDefsData['iconClass'])) {
			$params['iconClass'] = $clientDefsData['iconClass'];
		}
        
		// Copy view mode settings
		if (!empty($clientDefsData['kanbanViewMode'])) {
			$params['kanbanViewMode'] = true;
		}
        
		if (!empty($scopeData['kanbanStatusIgnoreList'])) {
			$params['kanbanStatusIgnoreList'] = $scopeData['kanbanStatusIgnoreList'];
		}
        
		// Copy collection settings
		if (!empty($entityDefsData['collection']['sortBy'])) {
			$params['sortBy'] = $entityDefsData['collection']['sortBy'];
		}
        
		if (!empty($entityDefsData['collection']['asc'])) {
			$params['sortDirection'] = 'asc';
		} elseif (isset($entityDefsData['collection']['asc']) && $entityDefsData['collection']['asc'] === false) {
			$params['sortDirection'] = 'desc';
		}
        
		if (!empty($entityDefsData['collection']['textFilterFields'])) {
			$params['textFilterFields'] = $entityDefsData['collection']['textFilterFields'];
		}
        
		if (isset($entityDefsData['collection']['fullTextSearch'])) {
			$params['fullTextSearch'] = $entityDefsData['collection']['fullTextSearch'];
		}
        
		if (isset($entityDefsData['collection']['countDisabled'])) {
			$params['countDisabled'] = $entityDefsData['collection']['countDisabled'];
		}
        
		if (isset($entityDefsData['optimisticConcurrencyControl'])) {
			$params['optimisticConcurrencyControl'] = $entityDefsData['optimisticConcurrencyControl'];
		}
        
		// Create the new entity
		$actualName = $entityManagerTool->create($newName, $type, $params);
        
		// Copy additional metadata that wasn't handled by create
        
		// Copy fields and links from entityDefs
		$linksToCreate = [];
		$generatedForeignLinks = []; // Track foreign links we're creating in this operation
		
		if ($entityDefsData) {
			$newEntityDefs = $this->metadata->get(['entityDefs', $actualName]);
            
			// Copy fields
			if (!empty($entityDefsData['fields'])) {
				foreach ($entityDefsData['fields'] as $fieldName => $fieldDefs) {
					// Skip system fields that are already created
					if (in_array($fieldName, ['id', 'name', 'createdAt', 'modifiedAt', 'createdBy', 'modifiedBy', 'assignedUser', 'teams'])) {
						continue;
					}
					
					// Skip link-related fields - these will be created when links are established
					$fieldType = $fieldDefs['type'];
					if (in_array($fieldType, ['link', 'linkMultiple', 'linkParent'])) {
						continue;
					}
                    
					$newEntityDefs['fields'][$fieldName] = $fieldDefs;
				}
			}
            
			// Collect links to create (we'll create them properly after entity is saved)
			if (!empty($entityDefsData['links'])) {
				foreach ($entityDefsData['links'] as $linkName => $linkDefs) {
					// Skip system links
					if (in_array($linkName, ['createdBy', 'modifiedBy', 'assignedUser', 'teams'])) {
						continue;
					}
					
					// Skip links without entity (like parent links which have entityList instead)
					if (empty($linkDefs['entity'])) {
						continue;
					}
					
					// Skip self-referential links for now (they're complex to handle)
					if ($linkDefs['entity'] === $sourceEntityType) {
						continue;
					}
					
					// Generate unique foreign link name for the cloned entity
					$linkForeign = $linkDefs['foreign'] ?? null;
					if ($linkForeign) {
						// Convert entity name to camelCase for link name
						$linkForeignBase = lcfirst($actualName);
						
						// For hasMany links, pluralize the name
						if (($linkDefs['type']) === 'hasMany') {
							// Simple pluralization - add 's' if not already plural
							if (!preg_match('/s$/', $linkForeignBase)) {
								$linkForeignBase .= 's';
							}
						}
						
						// Check if this foreign link name already exists on the foreign entity
						$foreignEntityDefs = $this->metadata->get(['entityDefs', $linkDefs['entity'], 'links']);
						$linkForeignUnique = $linkForeignBase;
						$counter = 1;
						
						// Initialize tracking array for this foreign entity if not exists
						if (!isset($generatedForeignLinks[$linkDefs['entity']])) {
							$generatedForeignLinks[$linkDefs['entity']] = [];
						}
						
						// Check both existing metadata and links we're about to create
						while (isset($foreignEntityDefs[$linkForeignUnique]) ||
						       in_array($linkForeignUnique, $generatedForeignLinks[$linkDefs['entity']])) {
							$linkForeignUnique = $linkForeignBase . $counter;
							$counter++;
						}
						
						// Track this foreign link name so we don't reuse it
						$generatedForeignLinks[$linkDefs['entity']][] = $linkForeignUnique;
						
						$linkForeign = $linkForeignUnique;
					}
					
					// Prepare link creation params
					$linkParams = [
						'entity' => $actualName,
						'link' => $linkName,
						'entityForeign' => $linkDefs['entity'],
						'linkForeign' => $linkForeign,
						'label' => $this->language->translate($linkName, 'links', $sourceEntityType),
						'labelForeign' => null,
					];
					
					// Determine link type
					$linkType = $linkDefs['type'] ?? null;
					// Don't look up the old foreign link - we need to determine the type based on the current link type
					$foreignType = null;
					
					// Determine foreign type based on current link type
					if ($linkType === 'hasMany') {
						// hasMany can be paired with belongsTo (one-to-many) or hasMany (many-to-many)
						// For cloning, assume one-to-many by default unless it has a relationName
						$foreignType = !empty($linkDefs['relationName']) ? 'hasMany' : 'belongsTo';
					} elseif ($linkType === 'belongsTo') {
						$foreignType = 'hasMany';
					} elseif ($linkType === 'hasOne') {
						$foreignType = 'belongsTo';
					}
					
					// Map EspoCRM link types to LinkManager link types
					if ($linkType === 'hasMany' && $foreignType === 'belongsTo') {
						$linkParams['linkType'] = 'oneToMany';
					} elseif ($linkType === 'belongsTo' && $foreignType === 'hasMany') {
						$linkParams['linkType'] = 'manyToOne';
					} elseif ($linkType === 'hasMany' && $foreignType === 'hasMany') {
						$linkParams['linkType'] = 'manyToMany';
						if (!empty($linkDefs['relationName'])) {
							$linkParams['relationName'] = $linkDefs['relationName'];
						}
					} elseif ($linkType === 'hasOne') {
						$linkParams['linkType'] = 'oneToOneLeft';
					} elseif ($linkType === 'belongsTo' && $linkForeign && $this->metadata->get(['entityDefs', $linkDefs['entity'], 'links', $linkForeign, 'type']) === 'hasOne') {
						$linkParams['linkType'] = 'oneToOneRight';
					} else {
						// Skip unknown link type combinations
						continue;
					}
					
					// Copy additional link parameters
					if (!empty($linkDefs['audited'])) {
						$linkParams['audited'] = true;
					}
					
					// Check for linkMultiple fields
					$fieldDefs = $this->metadata->get(['entityDefs', $sourceEntityType, 'fields', $linkName]);
					if (($fieldDefs['type'] ?? null) === 'linkMultiple') {
						$linkParams['linkMultipleField'] = true;
					}
					
					if (!empty($linkDefs['foreign'])) {
						$foreignFieldDefs = $this->metadata->get(['entityDefs', $linkDefs['entity'], 'fields', $linkDefs['foreign']]);
						if (($foreignFieldDefs['type'] ?? null) === 'linkMultiple') {
							$linkParams['linkMultipleFieldForeign'] = true;
						}
					}
					
					// Copy relationship panel settings
					$panelDefs = $this->metadata->get(['clientDefs', $sourceEntityType, 'relationshipPanels', $linkName]);
					if (!empty($panelDefs['layout'])) {
						$linkParams['layout'] = $panelDefs['layout'];
					}
					if (!empty($panelDefs['selectPrimaryFilterName'])) {
						$linkParams['selectFilter'] = $panelDefs['selectPrimaryFilterName'];
					}
					
					$foreignPanelDefs = $this->metadata->get(['clientDefs', $linkDefs['entity'], 'relationshipPanels', $linkDefs['foreign']]) ?? [];
					if (!empty($foreignPanelDefs['layout'])) {
						$linkParams['layoutForeign'] = $foreignPanelDefs['layout'];
					}
					if (!empty($foreignPanelDefs['selectPrimaryFilterName'])) {
						$linkParams['selectFilterForeign'] = $foreignPanelDefs['selectPrimaryFilterName'];
					}
					
					$linksToCreate[] = $linkParams;
				}
			}
            
			// Copy indexes
			if (!empty($entityDefsData['indexes'])) {
				$newEntityDefs['indexes'] = $entityDefsData['indexes'];
			}
            
			$this->metadata->set('entityDefs', $actualName, $newEntityDefs);
		}
        
		// Copy client definitions
		if ($clientDefsData) {
			$newClientDefs = $this->metadata->get(['clientDefs', $actualName]);
            
			// Copy views
			if (!empty($clientDefsData['views'])) {
				$newClientDefs['views'] = $clientDefsData['views'];
			}
            
			// Copy other client settings
			$clientSettingsToCopy = [
			    'controller', 'acl', 'aclScope', 'aclPortal', 'aclPortalScope',
			    'relationshipPanels', 'additionalLayouts', 'bottomPanels',
			    'defaultFilterData', 'selectDefaultFilters', 'boolFilterList',
			    'primaryFilterClassNameMap', 'dynamicLogic', 'additionalFields',
			    'createDisabled', 'duplicateDisabled', 'entityManagerCreateDisabled'
			];
            
			foreach ($clientSettingsToCopy as $setting) {
				if (!empty($clientDefsData[$setting])) {
					$newClientDefs[$setting] = $clientDefsData[$setting];
				}
			}
            
			$this->metadata->set('clientDefs', $actualName, $newClientDefs);
		}
        
		// Copy selectDefs if they exist
		if ($selectDefsData) {
			$this->metadata->set('selectDefs', $actualName, $selectDefsData);
		}
        
		// Copy recordDefs if they exist
		if ($recordDefsData) {
			$this->metadata->set('recordDefs', $actualName, $recordDefsData);
		}
        
		// Copy aclDefs if they exist
		if ($aclDefsData) {
			$this->metadata->set('aclDefs', $actualName, $aclDefsData);
		}
        
		// Copy layouts
		$sourceLayoutPath = 'custom/Espo/Custom/Resources/layouts/' . $sourceEntityType;
		$destLayoutPath = 'custom/Espo/Custom/Resources/layouts/' . $actualName;
        
		if ($this->fileManager->isDir($sourceLayoutPath)) {
			$this->fileManager->copy($sourceLayoutPath, $destLayoutPath);
		}
        
		// Copy translations for all languages
		$languageList = $this->metadata->get(['app', 'language', 'list'], []);
		foreach ($languageList as $language) {
			$sourceTranslationFile = "custom/Espo/Custom/Resources/i18n/{$language}/{$sourceEntityType}.json";
			$destTranslationFile = "custom/Espo/Custom/Resources/i18n/{$language}/{$actualName}.json";
			
			if ($this->fileManager->isFile($sourceTranslationFile)) {
				// Read existing translation that was auto-created
				$existingTranslation = [];
				if ($this->fileManager->isFile($destTranslationFile)) {
					$existingContent = $this->fileManager->getContents($destTranslationFile);
					$existingTranslation = Json::decode($existingContent, true);
				}
				
				// Read source translation
				$sourceContent = $this->fileManager->getContents($sourceTranslationFile);
				$sourceTranslation = Json::decode($sourceContent, true);
				
				// Merge translations (keep auto-generated labels, add custom translations)
				$mergedTranslation = array_merge($sourceTranslation, $existingTranslation);
				
				// Write merged translation
				$this->fileManager->putContents(
					$destTranslationFile, 
					Json::encode($mergedTranslation, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
				);
			}
		}
        
		// Save metadata
		$this->metadata->save();
        
		// Rebuild
		$this->dataManager->rebuild();
		
		// Create links using LinkManager after entity is fully created
		if (!empty($linksToCreate)) {
			$linkManager = $this->getLinkManager();

			foreach ($linksToCreate as $linkParams) {
				try {
					// Set labelForeign based on the foreign link name
					if (!empty($linkParams['linkForeign'])) {
						$linkParams['labelForeign'] = $this->language->translate(
							$linkParams['linkForeign'], 
							'links', 
							$linkParams['entityForeign']
						);
					}
					
					// Ensure required parameters are strings, not mixed types
					$createParams = [
						'entity' => (string) $linkParams['entity'],
						'link' => (string) $linkParams['link'],
						'entityForeign' => (string) $linkParams['entityForeign'],
						'linkForeign' => is_string($linkParams['linkForeign']) ? $linkParams['linkForeign'] : '',
						/** @phpstan-ignore-next-line */
						'label' => (string) $linkParams['label'],
						/** @phpstan-ignore-next-line */
						'labelForeign' => (string) ($linkParams['labelForeign']),
						'linkType' => (string) $linkParams['linkType'],
					];
					
					// Add optional parameters
					if (isset($linkParams['relationName'])) {
						$createParams['relationName'] = (string) $linkParams['relationName'];
					}
					if (isset($linkParams['audited'])) {
						$createParams['audited'] = (bool) $linkParams['audited'];
					}
					if (isset($linkParams['linkMultipleField'])) {
						$createParams['linkMultipleField'] = (bool) $linkParams['linkMultipleField'];
					}
					if (isset($linkParams['linkMultipleFieldForeign'])) {
						$createParams['linkMultipleFieldForeign'] = (bool) $linkParams['linkMultipleFieldForeign'];
					}
					if (isset($linkParams['layout'])) {
						$createParams['layout'] = (string) $linkParams['layout'];
					}
					if (isset($linkParams['layoutForeign'])) {
						$createParams['layoutForeign'] = (string) $linkParams['layoutForeign'];
					}
					if (isset($linkParams['selectFilter'])) {
						$createParams['selectFilter'] = (string) $linkParams['selectFilter'];
					}
					if (isset($linkParams['selectFilterForeign'])) {
						$createParams['selectFilterForeign'] = (string) $linkParams['selectFilterForeign'];
					}
					
					$linkManager->create($createParams);
				} catch (\Exception $e) {
					// Log error but continue with other links
					$GLOBALS['log']->warning(
						"Failed to create link {$linkParams['link']} for entity {$actualName}: " . 
						$e->getMessage()
					);
				}
			}
			
			// Rebuild again after creating links
			$this->dataManager->rebuild();
		}
        
		return (object) ['name' => $actualName];
	}

	/**
	 * @throws BadRequest
	 * @throws Error
	 */
	public function postActionUpdateLinkParams(Request $request): bool {
		$entityType = $request->getParsedBody()->entityType;
		$link = $request->getParsedBody()->link;
		$rawParams = $request->getParsedBody()->params;

		if (!is_string($entityType) || !is_string($link) || !$rawParams instanceof stdClass) {
			throw new BadRequest();
		}

		/** @var array{readOnly?: bool, foreignName?: string} $params */
		$params = [];

		if (property_exists($rawParams, 'readOnly')) {
			$params['readOnly'] = (bool) $rawParams->readOnly;
		}

		if (property_exists($rawParams, 'foreignName')) {
			$params['foreignName'] = (string) $rawParams->foreignName;
		}

		// Use extended LinkManager (supports foreignName)
		$this->getLinkManager()->updateParams($entityType, $link, $params);

		return true;
	}

	/**
	 * @throws BadRequest
	 * @throws Error
	 */
	public function postActionResetLinkParamsToDefault(Request $request): bool {
		$entityType = $request->getParsedBody()->entityType;
		$link = $request->getParsedBody()->link;

		if (!is_string($entityType) || !is_string($link)) {
			throw new BadRequest();
		}

		// Use extended LinkManager (supports foreignName)
		$this->getLinkManager()->resetToDefault($entityType, $link);

		return true;
	}
}