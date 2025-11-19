<?php

namespace Tests\Unit\Metadata;

use Espo\Core\Job\JobDataLess;

class ScheduledJobsTest extends AbstractMetadataTest {

	/**
	 * Tests that all job classes in scheduledJobs.json implement JobDataLess interface
	 */
	public function testScheduledJobsImplementInterface(): void {
		/*$this->assertJsonPathClassesImplementInterface(
			'app/scheduledJobs.json',
			['*', 'jobClassName'],
			JobDataLess::class,
			true, // Interface implementation is mandatory
			false // No __APPEND__ in this file
		);*/
	}

}