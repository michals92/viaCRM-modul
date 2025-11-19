/// <reference types="jquery" />

declare namespace jSignature {
	/**
	 * Options you can pass to jSignature on initialization.
	 * (These are partial and based on the jSignature documentation;
	 *  feel free to add/remove as relevant for your usage.)
	 */
	interface JSignatureOptions {
		width?: number | string;
		height?: number | string;
		color?: string; // color of the signature line stroke
		lineWidth?: number; // stroke width
		backgroundColor?: string; // underlying widget background color
		decorColor?: string; // signature line color
		signatureLine?: boolean; // see docs for whether to display a guide line
		border?: string; // e.g. "1px dashed #ccc"
		UndoButton?: boolean | (() => JQuery); // can be boolean or a function returning a custom button
		/**
		 * You can add any other custom or plugin-specific options here,
		 * or just allow unknown properties via index signature:
		 */
		[key: string]: any;
	}

	/**
	 * Return type from getData() is typically [mimeType, dataString].
	 * e.g. ["image/jsignature;base30","long-base30-string"]
	 * or ["image/png;base64","iVBORw0KGgo..."] for PNG, etc.
	 */
	type GetDataReturn = [string, string];

	/**
	 * Distinct categories for the listPlugins command.
	 */
	type ListPluginsCategory = 'import' | 'export';
}

interface JQuery {
	/**
	 * Initialize jSignature with optional settings or
	 * call commands on an already initialized jSignature instance.
	 */

	// 1) No arguments => initializes with defaults
	jSignature(): JQuery;

	// 2) Pass an options object => initializes with given options
	jSignature(options: jSignature.JSignatureOptions): JQuery;

	// 3) Command overloads:

	/**
	 * init (re-init) with options.
	 */
	jSignature(command: 'init', options: jSignature.JSignatureOptions): JQuery;

	/**
	 * resets/clears the pad
	 * (also aliased as 'clear')
	 */
	jSignature(command: 'reset'): JQuery;
	jSignature(command: 'clear'): JQuery;

	/**
	 * getData returns an array [mimeType, dataString] for the specified format.
	 * Example: ['image/jsignature;base30', 'base30_data_here']
	 */
	jSignature(command: 'getData', format?: string): jSignature.GetDataReturn;

	/**
	 * setData or importData => sets signature data from external source.
	 * data can be a data URL or base30 string, possibly with a format.
	 */
	jSignature(command: 'setData' | 'importData', data: string, format?: string): JQuery;

	/**
	 * listPlugins returns an array of plugin names for the specified category.
	 */
	jSignature(command: 'listPlugins', category: jSignature.ListPluginsCategory): string[];

	/**
	 * Generic catch-all for untyped commands.
	 */
	jSignature(command: string, ...args: any[]): any;
}
