import { helpers } from '@viacrm/module-build-tools';
import fs from 'fs-extra';

const packageJson = await fs.readJSON('package.json');

export const metadata = await helpers.metadata.parseAsync(packageJson);
