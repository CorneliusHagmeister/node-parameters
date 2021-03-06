
parameters = require '../../src'
client = require '../../src/plugins/grpc_client/client'

describe 'grpc_client.ping', ->
  
  it 'send and receive a message', ->
    app = parameters
      grpc:
        address: '0.0.0.0'
        port: 50051
    await app.grpc_start()
    conn = client address: '127.0.0.1', port: 50051
    response = await conn.ping name: 'pong'
    try
      response.message.should.eql 'pong'
    finally
      await app.grpc_stop()
    null
