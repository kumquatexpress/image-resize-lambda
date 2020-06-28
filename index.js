'use strict'
const handler = require('./handler')

exports.handler = function(event, context, callback) {
  const namespace = event.queryStringParameters.namespace // namespace of the image (bucket)
  , sizes = event.queryStringParameters.sizes.split(',').map(s => {
    return s.split('x').map(Number)
  })
  , bucket = event.queryStringParameters.bucket
  , ignoreAspectRatio = event.queryStringParameters.ignoreAspectRatio
  , withoutEnlargement = event.queryStringParameters.withoutEnlargement
  , prefix = event.queryStringParameters.prefix
  , body = Buffer.from(event.body, 'base64') // bytes

  const options = {
    ignoreAspectRatio,
    withoutEnlargement,
    prefix
  }
  console.log(`calling image resize for ${bucket}/${namespace}`, options, sizes)

  handler(bucket, namespace, sizes, body, options).then((resp) => {
    console.log("resp", resp)
    context.done(resp[0], resp[1])
  })
}

