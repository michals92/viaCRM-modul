<?php

namespace Espo\Modules\ViaCrm\Hooks\Absence;

use Espo\Core\Hook\Hook\BeforeSave;
use Espo\ORM\Entity;
use Espo\ORM\Repository\Option\SaveOptions;
use Espo\Core\Di;

class CalculateHours implements 
    BeforeSave,
    Di\EntityManagerAware,
    Di\LogAware
{
    use Di\EntityManagerSetter;
    use Di\LogSetter;

    public static int $order = 5; // Run before UpdateVacationHours

    public function beforeSave(Entity $entity, SaveOptions $options): void
    {
        $this->log->debug('CalculateHours: beforeSave called for Absence ' . $entity->getId());
        
        // Check if we need to recalculate hours
        $needsRecalculation = false;
        
        if ($entity->isNew()) {
            $needsRecalculation = true;
        } else {
            // Check if dates, HR record or halfDay changed
            if ($entity->isAttributeChanged('startDate') || 
                $entity->isAttributeChanged('endDate') || 
                $entity->isAttributeChanged('hrRecordId') ||
                $entity->isAttributeChanged('halfDay')) {
                $needsRecalculation = true;
            }
        }
        
        if (!$needsRecalculation) {
            $this->log->debug('CalculateHours: No recalculation needed');
            return;
        }
        
        $startDate = $entity->get('startDate');
        $endDate = $entity->get('endDate');
        $hrRecordId = $entity->get('hrRecordId');
        
        if (!$startDate || !$endDate) {
            $this->log->debug('CalculateHours: Missing dates, skipping');
            return;
        }
        
        // Calculate working days based on HR record working days
        if ($hrRecordId) {
            $workingDays = $this->calculateWorkingDaysForEmployee($startDate, $endDate, $hrRecordId);
            $hours = $this->calculateHours($hrRecordId, $workingDays);
            $this->log->debug('CalculateHours: Calculated ' . $workingDays . ' working days and ' . $hours . ' hours for employee');
        } else {
            // Fallback to standard calculation
            $workingDays = $this->calculateWorkingDays($startDate, $endDate);
            $hours = $workingDays * 8;
            $this->log->debug('CalculateHours: No HR record, calculated ' . $workingDays . ' working days, using default 8 hours/day = ' . $hours . ' hours');
        }
        
        // Check if it's a half-day absence (only valid when start and end date are the same)
        $isHalfDay = false;
        if ($entity->get('halfDay') && $startDate === $endDate) {
            $isHalfDay = true;
            $hours = $hours / 2;
            $this->log->debug('CalculateHours: Half-day absence detected, hours divided by 2: ' . $hours);
        }
        
        $entity->set('days', $workingDays);
        $entity->set('hours', $hours);
    }
    
    private function calculateWorkingDays(string $startDate, string $endDate): int
    {
        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);
        $end->modify('+1 day'); // Include end date
        
        $interval = new \DateInterval('P1D');
        $period = new \DatePeriod($start, $interval, $end);
        
        $workingDays = 0;
        foreach ($period as $date) {
            // Skip weekends (0 = Sunday, 6 = Saturday) - this is basic check
            if ($date->format('w') != 0 && $date->format('w') != 6) {
                $workingDays++;
            }
        }
        
        return $workingDays;
    }
    
    private function calculateWorkingDaysForEmployee(string $startDate, string $endDate, string $hrRecordId): int
    {
        $entityManager = $this->entityManager;
        
        // Get HR record to check working days
        $hrRecord = $entityManager->getEntityById('Hr', $hrRecordId);
        if (!$hrRecord) {
            // Fallback to standard calculation
            return $this->calculateWorkingDays($startDate, $endDate);
        }
        
        $workingDaysFromHr = $hrRecord->get('workingDays');
        if (!$workingDaysFromHr || !is_array($workingDaysFromHr)) {
            // Fallback to standard calculation
            return $this->calculateWorkingDays($startDate, $endDate);
        }
        
        // Map day names to numbers (0 = Sunday, 1 = Monday, ... 6 = Saturday)
        $dayMap = [
            'Sunday' => 0,
            'Monday' => 1,
            'Tuesday' => 2,
            'Wednesday' => 3,
            'Thursday' => 4,
            'Friday' => 5,
            'Saturday' => 6
        ];
        
        $employeeWorkingDays = [];
        foreach ($workingDaysFromHr as $dayName) {
            if (isset($dayMap[$dayName])) {
                $employeeWorkingDays[] = $dayMap[$dayName];
            }
        }
        
        $this->log->debug('CalculateHours: Employee working days: ' . implode(', ', $workingDaysFromHr) . ' (numbers: ' . implode(', ', $employeeWorkingDays) . ')');
        
        $start = new \DateTime($startDate);
        $end = new \DateTime($endDate);
        $end->modify('+1 day'); // Include end date
        
        $interval = new \DateInterval('P1D');
        $period = new \DatePeriod($start, $interval, $end);
        
        $workingDays = 0;
        foreach ($period as $date) {
            $dayOfWeek = (int)$date->format('w');
            if (in_array($dayOfWeek, $employeeWorkingDays)) {
                $workingDays++;
                $this->log->debug('CalculateHours: ' . $date->format('Y-m-d') . ' (' . $date->format('l') . ') is working day');
            } else {
                $this->log->debug('CalculateHours: ' . $date->format('Y-m-d') . ' (' . $date->format('l') . ') is NOT working day');
            }
        }
        
        return $workingDays;
    }
    
    private function calculateHours(string $hrRecordId, int $workingDays): float
    {
        $entityManager = $this->entityManager;
        
        // Get HR record
        $hrRecord = $entityManager->getEntityById('Hr', $hrRecordId);
        if (!$hrRecord) {
            $this->log->warning('CalculateHours: HR record not found: ' . $hrRecordId);
            return $workingDays * 8; // Default to 8 hours per day
        }
        
        // Get working hours per week
        $weeklyHours = $hrRecord->get('workingHours') ?? 40;
        
        // Get working days from HR record
        $workingDaysFromHr = $hrRecord->get('workingDays');
        $workingDaysCount = 5; // Default to 5 days
        
        if ($workingDaysFromHr && is_array($workingDaysFromHr)) {
            $workingDaysCount = count($workingDaysFromHr);
            $this->log->debug('CalculateHours: Employee works ' . $workingDaysCount . ' days per week: ' . implode(', ', $workingDaysFromHr));
        } else {
            $this->log->debug('CalculateHours: Using default 5 working days per week');
        }
        
        // Check if part-time
        $workingHoursType = $hrRecord->get('workingHoursType');
        if ($workingHoursType === 'Part-time') {
            $this->log->debug('CalculateHours: Part-time employee with ' . $weeklyHours . ' hours/week');
        } else {
            // Full-time default
            if ($weeklyHours == 0) {
                $weeklyHours = 40;
            }
            $this->log->debug('CalculateHours: Full-time employee with ' . $weeklyHours . ' hours/week');
        }
        
        // Calculate daily hours based on actual working days per week
        $dailyHours = $workingDaysCount > 0 ? ($weeklyHours / $workingDaysCount) : 8;
        
        // Calculate total hours
        $totalHours = $workingDays * $dailyHours;
        
        $this->log->debug('CalculateHours: ' . $workingDays . ' days × ' . $dailyHours . ' hours/day (' . $weeklyHours . 'h ÷ ' . $workingDaysCount . ' days) = ' . $totalHours . ' hours');
        
        return $totalHours;
    }
}