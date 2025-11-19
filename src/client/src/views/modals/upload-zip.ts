import type { ModalEvents } from 'espocrm/src/views/modal';

export interface UploadZipModalEvents extends ModalEvents {
	done: [];
}

define(['views/modal'], Dep => class extends Dep {
	override template = 'autocrm:modals/upload-zip';

	private fileContents: any = '';

	override setup() {
		this.events['change input[name="zip"]'] = (e: any) => {
			const files = e.currentTarget.files;

			if (files.length) {
				this.selectFile(files[0]);
			}
		};

		this.buttonList = [
			{
				name: 'close',
				label: 'Close',
			},
		];

		this.addActionHandler('upload', this.upload.bind(this));
	}

	selectFile(file) {
		const fileReader = new FileReader();

		fileReader.onload = e => {
			if (!e.target) {
				throw new Error();
			}

			this.fileContents = e.target.result;
			this.$el.find('button[data-action="upload"]').removeClass('disabled').removeAttr('disabled');
		};

		fileReader.readAsDataURL(file);
	}

	upload() {
		this.$el.find('button[data-action="upload"]').addClass('disabled').attr('disabled', 'disabled');

		Espo.Ui.notify(this.translate('Uploading...'));

		const categoryId: any = this.options.categoryId;

		let url = 'Document/uploadFromZip';

		if (categoryId) {
			url += '/' + categoryId;
		}

		Espo.Ajax.postRequest(url, this.fileContents).then(() => {
			Espo.Ui.notify(false);

			this.trigger('done');
			this.close();
		});
	}
});
