<?php

namespace Espo\Modules\ViaCrm\Entities;

use Espo\Core\ORM\Entity;

class Alert extends Entity
{
    public const ENTITY_TYPE = 'Alert';
    
    protected $entityType = 'Alert';
    
    public const STATUS_DRAFT = 'Draft';
    public const STATUS_ACTIVE = 'Active';
    public const STATUS_RESOLVED = 'Resolved';
    public const STATUS_ARCHIVED = 'Archived';
    
    public const TYPE_INFO = 'Info';
    public const TYPE_WARNING = 'Warning';
    public const TYPE_SUCCESS = 'Success';
    public const TYPE_DANGER = 'Danger';
    public const TYPE_PRIMARY = 'Primary';
    
    public const PRIORITY_LOW = 'Low';
    public const PRIORITY_NORMAL = 'Normal';
    public const PRIORITY_HIGH = 'High';
    public const PRIORITY_URGENT = 'Urgent';

    public function getStatus(): ?string
    {
        return $this->get('status');
    }

    public function getType(): ?string
    {
        return $this->get('type');
    }

    public function getPriority(): ?string
    {
        return $this->get('priority');
    }

    public function isActive(): bool
    {
        return $this->get('status') === self::STATUS_ACTIVE;
    }

    public function isGlobal(): bool
    {
        return (bool) $this->get('isGlobal');
    }

    public function isClosable(): bool
    {
        return (bool) $this->get('isClosable');
    }

    /**
     * Check if alert is currently valid based on date range
     */
    public function isCurrentlyValid(): bool
    {
        $now = new \DateTime();
        $dateStart = $this->get('dateStart');
        $dateEnd = $this->get('dateEnd');
        
        if ($dateStart && $dateStart > $now->format('Y-m-d H:i:s')) {
            return false;
        }
        
        if ($dateEnd && $dateEnd < $now->format('Y-m-d H:i:s')) {
            return false;
        }
        
        return true;
    }

    /**
     * Get default icon based on alert type
     */
    public function getDefaultIcon(): string
    {
        $icons = [
            self::TYPE_INFO => 'fas fa-info-circle',
            self::TYPE_SUCCESS => 'fas fa-check-circle',
            self::TYPE_WARNING => 'fas fa-exclamation-triangle',
            self::TYPE_DANGER => 'fas fa-times-circle',
            self::TYPE_PRIMARY => 'fas fa-bell'
        ];
        
        $type = $this->getType();
        return $icons[$type] ?? 'fas fa-info-circle';
    }

    /**
     * Get default color based on alert type
     */
    public function getDefaultColor(): string
    {
        $colors = [
            self::TYPE_INFO => '#17a2b8',
            self::TYPE_SUCCESS => '#28a745',
            self::TYPE_WARNING => '#ffc107',
            self::TYPE_DANGER => '#dc3545',
            self::TYPE_PRIMARY => '#007bff'
        ];
        
        $type = $this->getType();
        return $colors[$type] ?? '#17a2b8';
    }

    /**
     * Get resolved icon class with fallback to default
     */
    public function getIconClass(): string
    {
        return $this->get('iconClass') ?: $this->getDefaultIcon();
    }

    /**
     * Get resolved color with fallback to default
     */
    public function getColor(): string
    {
        return $this->get('color') ?: $this->getDefaultColor();
    }
}