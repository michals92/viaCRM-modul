import type Collection from 'espocrm/src/collection';
import type DateTime from 'espocrm/src/date-time';
import type Settings from 'espocrm/src/models/settings';
import type { SearchManagerData } from 'espocrm/src/search-manager';
import type SearchManager from 'espocrm/src/search-manager';
import type Storage from 'espocrm/src/storage';

define(['search-manager'], (SearchMan) => {
	/**
	 * @memberOf module:viacrm:helpers/version
	 */
	class VersionHelper {
		currentVersion: string;

		constructor(settings?: Settings) {
			if (settings) {
				this.currentVersion = settings.get('version') ?? '0.0.0';
			} else {
				this.currentVersion = '0.0.0';
			}
		}

		/**
		 * @param {string} ver Version string
		 */
		isGreater(ver: string) {
			return VersionHelper.compareVersions(this.currentVersion, ver) === 1;
		}

		/**
		 * @param {string} ver Version string
		 */
		isGreaterOrEqual(ver: string) {
			return VersionHelper.compareVersions(this.currentVersion, ver) >= 0;
		}

		/**
		 * @param {string} ver Version string
		 */
		isLess(ver: string) {
			return VersionHelper.compareVersions(this.currentVersion, ver) === -1;
		}

		/**
		 * @param {string} ver Version string
		 */
		isLessOrEqual(ver: string) {
			return VersionHelper.compareVersions(this.currentVersion, ver) <= 0;
		}

		/**
		 * @param {string} ver Version string
		 */
		isEqual(ver: string) {
			return VersionHelper.compareVersions(this.currentVersion, ver) === 0;
		}

		/**
		 * @param {string} ver Version string
		 * @returns {(1|-1|0)}
		 */
		_versionCompare(ver: string) {
			return VersionHelper.compareVersions(this.currentVersion, ver);
		}

		/**
		 * Compare two version strings
		 * @param {string} version1 First version to compare
		 * @param {string} version2 Second version to compare
		 * @returns {(1|-1|0)} Returns 1 if version1 > version2, -1 if version1 < version2, 0 if equal
		 */
		static compareVersions(version1: string, version2: string): 1 | -1 | 0 {
			if (!version1 || !version2) {
				return 0;
			}

			const v1parts = version1.split('.').map(x => parseInt(x) || 0);
			const v2parts = version2.split('.').map(x => parseInt(x) || 0);
			
			// Normalize arrays to same length
			const maxLength = Math.max(v1parts.length, v2parts.length);
			while (v1parts.length < maxLength) v1parts.push(0);
			while (v2parts.length < maxLength) v2parts.push(0);

			for (let i = 0; i < maxLength; i++) {
				const part1 = v1parts[i] ?? 0;
				const part2 = v2parts[i] ?? 0;
				if (part1 > part2) return 1;
				if (part1 < part2) return -1;
			}

			return 0;
		}

		/**
		 * Parse and check extension version specification like "ModuleName>=1.0.0"
		 * @param {string} versionSpec Version specification
		 * @param {Record<string, any>} installedExtensions Object with installed extension info
		 * @returns {boolean} True if condition is met
		 */
		static checkExtensionVersion(versionSpec: string, installedExtensions: Record<string, {name: string, version: string}> | Array<{name: string, version: string}>): boolean {
			// Parse the version specification (e.g., "Approval>=0.0.3")
			const versionRegex = /^([A-Za-z][A-Za-z0-9_-]*)(>=|<=|>|<|=)(.+)$/;
			const match = versionSpec.match(versionRegex);
			
			if (!match) {
				return false;
			}
			
			const [, moduleName, operator, requiredVersion] = match;
			
			// TypeScript safety checks
			if (!moduleName || !operator || !requiredVersion) {
				return false;
			}
			
			// Handle both array and object formats
			let moduleInfo: {name: string, version: string} | undefined;
			if (Array.isArray(installedExtensions)) {
				moduleInfo = installedExtensions.find(ext => ext.name === moduleName);
			} else {
				moduleInfo = installedExtensions[moduleName];
			}
			
			if (!moduleInfo) {
				return false;
			}
			
			const installedVersion = moduleInfo.version;
			if (!installedVersion) {
				return false;
			}
			
			const comparison = VersionHelper.compareVersions(installedVersion, requiredVersion);
			
			switch (operator) {
				case '>=':
					return comparison >= 0;
				case '<=':
					return comparison <= 0;
				case '>':
					return comparison > 0;
				case '<':
					return comparison < 0;
				case '=':
					return comparison === 0;
				default:
					return false;
			}
		}

		createSearchManager(
			collection: Collection,
			type?: string|null,
			storage?: Storage|null,
			dateTime?: DateTime|null,
			defaultData?: SearchManagerData | null,
			emptyOnReset?: boolean
		): SearchManager {
			if (this.isGreaterOrEqual('9.1.0')) {
				const options: any = {};

				if (type) {
					options.storageKey = type;
				}

				if (defaultData) {
					options.defaultData = defaultData;
				}

				if (emptyOnReset) {
					options.emptyOnReset = emptyOnReset;
				}

				// @ts-ignore oof, Yuri refactored :((
				return new SearchMan(collection, options);
			} else {
				return new SearchMan(collection, type, storage, dateTime, defaultData, emptyOnReset);
			}
		}
	}

	return VersionHelper;
});