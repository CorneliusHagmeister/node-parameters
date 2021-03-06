// Generated by CoffeeScript 2.4.1
// # Parameters

// Usage: `parameters(config)`

// ## About options

// Options are defined at the "config" level or for each command.

// ## About main

// Main is what is left once the option and the commands have been extracted.
// Like options, "main" is defined at the "config" level or for each command.

// Parameters are defined with the following properties:

// * name:     name of the two dash parameter in the command (eg "--my_name") and in the returned parse object unless label is defined.
// * label:    not yet implemented, see name
// * shortcut: name of the one dash parameter in the command (eg "-n"), must be one charactere
// * required: boolean, throw an exception when true and the parameter is not defined
// * type:     one of 'string', 'boolean', 'integer' or 'array'
var Parameters;

Parameters = require('./Parameters');

require('./plugins/router');

require('./plugins/config');

require('./plugins/args');

require('./plugins/help');

require('./plugins/grpc_server');

module.exports = function(config) {
  return new Parameters(config);
};
