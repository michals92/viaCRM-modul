import 'dotenv/config';
import { helpers } from '@viacrm/module-build-tools';

export const env = await helpers.env.parseAsync(process.env);
