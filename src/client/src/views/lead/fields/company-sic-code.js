define(['views/fields/varchar'], Dep => class extends Dep {
	setup() {
		super.setup();

		this.listenTo(
			this.model,
			'change:' + this.name,
			this.onSicCodeChange.bind(this),
		);
	}

	onSicCodeChange() {
		const sicCode = this.model.get(this.name);
			
		if (sicCode) {
			Espo.Ajax.getRequest(`ZiveFirmy/lookup/${sicCode}`).then(
				response => {
					// Create JSON object for employees
					const employeeInfo = {};
					response.PocetZamestnancu.forEach(item => {
						employeeInfo[item.ROK] = {
							count: item.HODNOTA,
							code: item.KOD,
						};
					});

					// Create JSON object for turnover
					const turnoverInfo = {};
					response.Obrat.forEach(item => {
						turnoverInfo[item.ROK] = {
							value: item.HODNOTA,
							code: item.KOD,
						};
					});

					// Set the created objects in the model
					this.model.set('employeeInfo', employeeInfo);
					this.model.set('turnoverInfo', turnoverInfo);
				},
			);
		}
	}
});
