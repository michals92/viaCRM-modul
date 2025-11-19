define(['views/fields/base'], (Dep: any) =>
	class extends Dep {
		detailTemplateContent = '{{{value}}}';
		editTemplateContent = '{{{value}}}';

		getValueForDisplay(): string {
			const employeeInfo = this.model.get(this.name) as
				| Record<string, { count: any; code: string }>
				| null
				| undefined;

			if (!employeeInfo || Object.keys(employeeInfo).length === 0) {
				return this.translate('None');
			}

			const list = Object.entries(employeeInfo).map(([year, data]) => {
				let label: string;
				if (data.code === 'N') {
					label = `${year}: ${this.translate('Data Not Available', 'labels', 'Lead')}`;
				} else {
					label = `${year}: ${data.count}`;
				}
				return $('<span>').text(label).get(0)!.outerHTML;
			});

			return list.join('<br>');
		}

		fetch(): Record<string, unknown> {
			const value = this.model.get(this.name);
			return value ? { [this.name]: value } : {};
		}
	});
