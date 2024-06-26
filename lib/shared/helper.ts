/**
 * helper.ts
 * cdk-init
 * Created by khuongdv <khuongdv@vitalify.asia> on 2024-06-19
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

import 'dotenv/config';

/**
 * Get environment variables
 *
 * @param key
 */
export function getEnv(key: string) {
  return process.env[key] ?? '';
}


/**
 * Check current environment is development
 */
export const isDev = getEnv('STAGE') === 'dev';
export const isProd = getEnv('STAGE') === 'prod';
export const isStg = getEnv('STAGE') === 'stg';