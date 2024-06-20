/**
 * index.js
 * cdk_init
 * Created by khuongdv <khuongdv@vitalify.asia> on 2024-06-19
 * Copyright (c) 2024 VFA Asia Co.,Ltd. All rights reserved.
 */

function handler(event) {
  var key = 'LzdWGpAToQ1DqYuzHxE6YOqi7G3X2yvNBot9mCXfx5k';
  var response = {
    statusCode: 403,
    statusDescription: 'Forbidden',
    body: JSON.stringify({
      message: 'Access denied',
    }),
  };

  var request = event.request;
  var apikeyValue = request.querystring['x-api-key'];

  if (!apikeyValue || !apikeyValue['value'] || apikeyValue['value'] !== key) {
    return response;
  }

  return event.request;
}