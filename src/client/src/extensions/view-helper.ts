import type ViewHelper from 'espocrm/src/view-helper';

extend<ViewHelper>(Dep => class extends Dep {
	override sanitizeHtml(text: string, options?: Record<string, unknown>): string {
		// Fetch user-defined schemes from config, e.g. ['notes']
		const userSchemes = (this.config.get('sanitizerAllowedUrlSchemes') ?? []) as string[];

		// List of default schemes (split out "f|ht)tps?" as one piece)
		const defaultSchemes = [
			'(?:f|ht)tps?', // matches ftp, ftps, http, https
			'mailto',
			'tel',
			'callto',
			'sms',
			'cid',
			'xmpp',
		];

		// Safely escape user-supplied schemes to avoid breaking the pattern
		const escapedUserSchemes = userSchemes.map(scheme => scheme.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));

		// Merge default + user-defined schemes into a single group
		const allSchemes = [...defaultSchemes, ...escapedUserSchemes];

		// Build the final regex
		// e.g.:   ^(?:(?:(?:f|ht)tps?|mailto|tel|callto|...|notes):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))
		// This will allow the newly added schemes as valid prefixes
		const schemePattern = allSchemes.join('|');
		const regexp = new RegExp(
			`^(?:(?:${schemePattern}):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))`, // eslint-disable-line no-useless-escape
			'i',
		);

		// Pass the custom regex to sanitizeHtml
		return super.sanitizeHtml(text, {
			...options,
			ALLOWED_URI_REGEXP: regexp,
		});
	}
});
