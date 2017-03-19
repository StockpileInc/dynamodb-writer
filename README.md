# dynamodb-writer
[![Build Status][travis-image]][travis-url]
[![js-standard-style][standard-image]][standard-url]

[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/
[travis-image]: https://travis-ci.org/StockpileInc/dynamodb-writer.svg?branch=master
[travis-url]: https://travis-ci.org/StockpileInc/dynamodb-writer

Write items to a DynamoDB table in batches

## save()
Save an item to internal queue. On 25th item (DynamoDB maximum),
it will automatically call `flush()`.

**Important**: A current limitation is that you cannot make successive calls
to `save()` without waiting for callback first from each previous call to
`save()`.

## flush()
This will be called internally by `save()` once internal queue is full.
You should call this once after all `save()` calls are complete, to ensure
internal queue is emptied.

## Example
```js
const async = require('async')
const {DynamoDB} = require('aws-sdk')
const DynamoDbWriter = require('dynamodb-writer')

const dynamodb = new DynamoDB({
  apiVersion: '2012-08-10'
})
const writer = DynamoDbWriter.create(dynamodb, {table: 'my-table'})
const items = []
async.eachSeries(items, (item, cb) => {
  // Important: You must wait for callback to be called
  // before calling `save()` again
  writer.save(item, cb)
}, (err) => {
  if (err) {
    return console.error('Failed to save items')
  }
  writer.flush((err) => {
    if (err) {
      return console.error('Failed to flush items')
    }
  })
})
```
