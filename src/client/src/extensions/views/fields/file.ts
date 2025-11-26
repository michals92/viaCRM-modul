import type FileFieldView from 'espocrm/src/views/fields/file';

interface FileFieldParams {
	forceDownload?: boolean;
	[key: string]: unknown;
}

extend<FileFieldView>(Dep => class extends Dep {
	override listLinkTemplate: string = 'viacrm:fields/file/list-link';

	override getDownloadUrl(id: string): string {
		let url: string = super.getDownloadUrl(id);
		if ((this.params as FileFieldParams).forceDownload) {
			url += '&forceDownload=true';
		}
		return url;
	}
});
