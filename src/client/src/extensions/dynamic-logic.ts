import type { ConditionDefs } from 'espocrm/src/dynamic-logic';
import type { ExtensionInfo } from 'espocrm/src/app-params';

import type DynamicLogic from 'espocrm/src/dynamic-logic';

interface VersionHelperStatic {
	checkExtensionVersion(versionSpec: string, installedExtensions: ExtensionInfo[] | Record<string, ExtensionInfo>): boolean;
}

extend<DynamicLogic>(['viacrm:helpers/version'], (Dep, VersionHelper: VersionHelperStatic) => class extends Dep {
	private settings: { get: (name: string) => unknown } | null = null;
	private _cachedExtensions: ExtensionInfo[] | Record<string, ExtensionInfo> | null = null;

	override getAttributeValue(attribute: string, preSave?: boolean): unknown {
		if (attribute.startsWith('$user')) {
			const user = this.recordView.getUser();
			const requiredAttribute = attribute.replace('$user.', '');

			if (requiredAttribute === 'id') {
				return user.id;
			}

			if (requiredAttribute === 'teamsIds') {
				return user.getTeamIdList();
			}

			return user.get(requiredAttribute);
		} else if (attribute.startsWith('$settings')) {
			const settingName = attribute.replace('$settings.', '');

			return this.getSettings()?.get(settingName) ?? null;
		} else if (attribute.startsWith('$installedExtensions')) {
			return this.getInstalledExtensionAttribute(attribute);
		} else if (attribute.startsWith('$extensionVersion')) {
			// Handle $extensionVersion:ModuleName>=1.0.0 pattern
			const versionSpec = attribute.replace('$extensionVersion:', '');
			return this.checkExtensionVersionAttribute(versionSpec);
		} else {
			return super.getAttributeValue(attribute, preSave);
		}
	}

	override checkCondition(defs: ConditionDefs | ConditionDefs[], preSave?: boolean): boolean {
		// Handle array case - take first element
		if (Array.isArray(defs) && defs.length > 0) {
			defs = defs[0] as ConditionDefs;
		}

		const type = (defs as ConditionDefs).type ?? 'equals';

		if (['or', 'and', 'not'].includes(type)) {
			if (super.checkConditionGroupInternal) {
				return this.checkConditionGroupInternal((defs as ConditionDefs).value, type, preSave);
			} else {
				return this.checkConditionGroup((defs as ConditionDefs).value, type);
			}
		}

		if ((defs as ConditionDefs).subjectType === 'field') {
			const attribute = (defs as ConditionDefs).attribute;
			const field = (defs as ConditionDefs).field;
			const value = this.getAttributeValue(field as string, preSave);

			if (!attribute) {
				return false;
			}

			const setValue = this.getAttributeValue(attribute, preSave);

			if (type === 'equals') {
				// Handle string representations of special values
				let compareValue: unknown = value;
				if (value === 'undefined') {
					compareValue = undefined;
				} else if (value === 'null') {
					compareValue = null;
				}
				return setValue === compareValue;
			}

			if (type === 'notEquals') {
				// Handle string representations of special values
				let compareValue: unknown = value;
				if (value === 'undefined') {
					compareValue = undefined;
				} else if (value === 'null') {
					compareValue = null;
				}
				return setValue !== compareValue;
			}

			if (type === 'isEmpty') {
				if (Array.isArray(setValue)) {
					return !setValue.length;
				}

				return setValue === null || setValue === '' || typeof setValue === 'undefined';
			}

			if (type === 'isNotEmpty') {
				if (Array.isArray(setValue)) {
					return !!setValue.length;
				}

				return setValue !== null && setValue !== '' && typeof setValue !== 'undefined';
			}

			if (type === 'isTrue') {
				return !!setValue;
			}

			if (type === 'isFalse') {
				return !setValue;
			}

			if (type === 'contains' || type === 'has') {
				if (!setValue) {
					return false;
				}

				if (Array.isArray(value)) {
					return value.some(item => (setValue as string | unknown[]).includes(item));
				} else {
					return !!(setValue as string).indexOf(value as string) >= 0;
				}
			}

			if (type === 'notContains' || type === 'notHas') {
				if (!setValue) {
					return true;
				}

				if (Array.isArray(value)) {
					return !value.some(item => (setValue as string | unknown[]).includes(item));
				} else {
					return (setValue as string).indexOf(value as string) < 0;
				}
			}

			if (type === 'startsWith') {
				if (!setValue) {
					return false;
				}

				return (setValue as string).indexOf(value as string) === 0;
			}

			if (type === 'endsWith') {
				if (!setValue) {
					return false;
				}

				return (setValue as string).indexOf(value as string) === (setValue as string).length - (value as string).length;
			}

			if (type === 'matches') {
				if (!setValue) {
					return false;
				}

				const match = /^\/(.*)\/([a-z]*)$/.exec(value as string);

				if (!match || match.length < 2) {
					return false;
				}

				return new RegExp(match[1] as string, match[2]).test(setValue as string);
			}

			if (type === 'greaterThan') {
				return (setValue as number) > (value as number);
			}

			if (type === 'lessThan') {
				return (setValue as number) < (value as number);
			}

			if (type === 'greaterThanOrEquals') {
				return (setValue as number) >= (value as number);
			}

			if (type === 'lessThanOrEquals') {
				return (setValue as number) <= (value as number);
			}

			if (type === 'in') {
				return (value as unknown[]).indexOf(setValue) >= 0;
			}

			if (type === 'notIn') {
				return (value as unknown[]).indexOf(setValue) < 0;
			}

			if (type === 'isToday') {
				const dateTime = this.recordView.getDateTime();

				if (!setValue) {
					return false;
				}

				if ((setValue as string).length > 10) {
					return dateTime.toMoment(setValue).isSame(dateTime.getNowMoment(), 'day');
				}

				return dateTime.toMomentDate(setValue).isSame(dateTime.getNowMoment(), 'day');
			}

			if (type === 'inFuture') {
				const dateTime = this.recordView.getDateTime();

				if (!setValue) {
					return false;
				}

				if ((setValue as string).length > 10) {
					return dateTime.toMoment(setValue).isAfter(dateTime.getNowMoment(), 'second');
				}

				return dateTime.toMomentDate(setValue).isAfter(dateTime.getNowMoment(), 'day');
			}

			if (type === 'inPast') {
				const dateTime = this.recordView.getDateTime();

				if (!setValue) {
					return false;
				}

				if ((setValue as string).length > 10) {
					return dateTime.toMoment(setValue).isBefore(dateTime.getNowMoment(), 'second');
				}

				return dateTime.toMomentDate(setValue).isBefore(dateTime.getNowMoment(), 'day');
			}

			return false;
		} else {
			return super.checkCondition(defs, preSave);
		}
	}

	getSettings(): { get: (name: string) => unknown } | null {
		this.settings ??= this.recordView?.getHelper()?.settings;
		return this.settings ?? null;
	}

	/**
	 * Get cached installed extensions
	 */
	getInstalledExtensions(): ExtensionInfo[] | Record<string, ExtensionInfo> {
		if (!this._cachedExtensions) {
			this._cachedExtensions = this.recordView?.getHelper()?.getAppParam?.('installedExtensions') ?? [];
		}
		return this._cachedExtensions;
	}

	/**
	 * Handle $installedExtensions attribute access
	 */
	getInstalledExtensionAttribute(attribute: string): string[] | unknown | null {
		if (attribute === '$installedExtensions') {
			// Return list of installed extension names (backward compatibility)
			const extensions = this.getInstalledExtensions();
			if (Array.isArray(extensions)) {
				return extensions.map(ext => ext.name);
			} else {
				return Object.keys(extensions);
			}
		}

		// Handle $installedExtensions.ModuleName.property pattern
		const parts = attribute.split('.');
		if (parts.length >= 3) {
			const moduleName = parts[1];
			const installedExtensions = this.getInstalledExtensions();
			const moduleInfo = Array.isArray(installedExtensions)
				? installedExtensions.find(ext => ext.name === moduleName)
				: installedExtensions[moduleName as string];

			if (!moduleInfo) {
				return null;
			}

			// Navigate nested properties (e.g., 'version' or 'licenseStatus')
			let value: unknown = moduleInfo;
			for (const prop of parts.slice(2)) {
				value = (value as Record<string, unknown>)?.[prop];
				if (value === undefined) {
					return null;
				}
			}
			return value;
		}
		return null;
	}

	/**
	 * Handle $extensionVersion:ModuleName>=1.0.0 attribute access
	 */
	checkExtensionVersionAttribute(versionSpec: string): boolean {
		const installedExtensions = this.getInstalledExtensions();
		return VersionHelper.checkExtensionVersion(versionSpec, installedExtensions);
	}
});
