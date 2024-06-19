/**
 * environment.ts
 * cdk-init
 * Created by khuongdv <khuongdv@vitalify.asia> on 2024-06-19
 * Copyright (c) 2023 VFA Asia Co.,Ltd. All rights reserved.
 */

import { getEnv } from "../lib/shared/helper";

export const STAGE = getEnv('STAGE');
export const PROJECT = getEnv('PROJECT');

export const PREFIX = `${PROJECT}-${STAGE}`;
export const ENV = {
  stage: STAGE,
  prefix: PREFIX,
  cidrBlock: getEnv('CIDR_BLOCK')
};
