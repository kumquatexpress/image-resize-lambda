'use strict'

const AWS = require('aws-sdk')
, S3 = new AWS.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  signatureVersion: 'v4',
})
, imageType = require('image-type')
, Sharp = require('sharp')
, blockhash = require('blockhash')

const getKeyForSize = function(namespace, name, w, h, ext, prefix='') {
  return `${namespace}/${prefix}${name}_${w}_${h}.${ext}`
}

module.exports = (bucket, namespace, sizes, body, options = {}) => {
  const {ext, mime} = imageType(body)

  let key
  return Promise.map(sizes.concat([[0,0]]), ([w, h]) => {
    let t = Date.now()
    let resizeFunc = Sharp(body)
    if (w !== 0){
        resizeFunc = resizeFunc.resize(w, h)
      if (options.ignoreAspectRatio) {
        resizeFunc = resizeFunc.ignoreAspectRatio()
      }
      if (options.withoutEnlargement) {
        resizeFunc = resizeFunc.withoutEnlargement()
      }
    }
    return resizeFunc.toBuffer().then(buffer => {
      console.log(`done resizing`, Date.now() - t)
      if (!key) {
        key = blockhash.blockhashBuf(buffer, mime, 12, 2) // image hash
      }
      t = Date.now()

      const _key = getKeyForSize(namespace, key, w, h, ext, options.prefix)
      console.log(`${_key} done hashing`, Date.now() - t)

      return S3.headObject({
        Bucket: bucket,
        Key: _key,
      }).promise().then(() => {
        console.log(`${_key} already exists`)
      }).catch(() => {
        let t2 = Date.now()
        return S3.putObject({
          Body: buffer,
          Bucket: bucket,
          ContentType: mime,
          Key: _key,
        }).promise().then(() => {
          console.log(`${_key} done uploading`, Date.now() - t2)
        })
      })
    })
  }, {concurrency: 4})
  .then(() => {
    console.log("finished successfully", namespace, sizes)
    return [null, {
      statusCode: 200,
      body: JSON.stringify({
        key,
        ext,
        bucket,
        namespace,
        sizes,
      }),
    }]
  })
  .catch(err => {
    console.log("err", err)
    return [err, {}]
  })
}
