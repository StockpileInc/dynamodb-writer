'use strict'

const debug = require('debug')('dynamodb-writer')

exports.create = (dynamodb, opts) => {
  return new DynamoDbWriter(dynamodb, opts)
}

class DynamoDbWriter {
  constructor (dynamodb, opts) {
    this.dynamodb = dynamodb
    this.table = opts.table
    this.queue = []
  }

  save (item, cb) {
    this.queue.push(item)
    if (this.queue.length === 25) {
      debug('saved 25th item in queue, flushing...')
      return this.flush(cb)
    }
    setImmediate(cb)
  }

  flush (cb) {
    const self = this
    if (!self.queue.length) return setImmediate(cb)
    write(handleRes)

    function handleRes (err, res) {
      if (err) {
        debug('batchWriteItem failed', err.toString())
        return cb(err)
      }
      debug('handleRes')

      // re-queue and write any UnprocessedItems
      self.queue = []
      if (res.UnprocessedItems[self.table]) {
        self.queue = res.UnprocessedItems[self.table].map(request => {
          return request.PutRequest.Item
        })
      }
      if (self.queue.length) return write(handleRes)

      // no UnprocessedItems to write
      debug('flush complete')
      cb(null)
    }

    function write (cb) {
      debug(`writing ${self.queue.length} items...`)
      const params = buildParams.call(self)
      self.dynamodb.batchWriteItem(params, cb)
    }
  }
}

function buildParams () {
  const tableItems = this.queue.map(item => {
    return { PutRequest: {Item: item} }
  })

  const params = { RequestItems: {} }
  params.RequestItems[this.table] = tableItems
  return params
}
