import type { PanelDefs } from 'espocrm/src/views/record/detail';
import type DetailRecordView from 'espocrm/src/views/record/detail';

extend((Dep: typeof DetailRecordView) => class extends Dep {
	modifyDetailLayout(layout: PanelDefs[]) {
		// Define the new field to be added
		const newField = {
			name: 'manualStyle',
			label: 'manualStyleInForm',
		};

		// Find the 'manual' panel
		const manualPanel = layout.find(panel => panel.name === 'manual');

		if (manualPanel) {
			if (!manualPanel.rows) {
				manualPanel.rows = [];
			}

			// **Prevent Duplicate Insertions**
			const fieldExists = manualPanel.rows.some(row =>
				row.some(field => field && field.name === 'manualStyle'),
			);

			if (!fieldExists) {
				let inserted = false;

				// Iterate through each row in the 'manual' panel
				for (const row of manualPanel.rows) {
					// Check each spot in the row for a 'false' value
					for (let i = 0; i < row.length; i++) {
						if (row[i] === false) {
							// Insert the new field into the empty spot
							row[i] = newField;
							inserted = true;
							break; // Exit the inner loop once inserted
						}
					}

					if (inserted) break; // Exit the outer loop once inserted
				}

				// If there was no empty spot, add a new row with the new field
				if (!inserted) {
					manualPanel.rows.push([newField]);
				}
			}
		}
	}
});
