// Generated by CoffeeScript 2.4.1
// ## Plugin "help"

// Dependencies
var Parameters, clone, error, is_object_literal, merge, pad, path;

path = require('path');

pad = require('pad');

error = require('../utils/error');

({clone, is_object_literal, merge} = require('mixme'));

// Parameters & plugins
Parameters = require('../Parameters');

require('../plugins/config');

Parameters.prototype.init = (function(parent) {
  return function() {
    this.register({
      configure_set: function({config, command}, handler) {
        if (command.length) {
          return handler;
        }
        if (config.commands == null) {
          config.commands = {};
        }
        if (!command.length) {
          if (config.description == null) {
            config.description = 'No description yet';
          }
        }
        // No "help" option for command "help"
        if (!command.length || !config.help) {
          if (config.options == null) {
            config.options = {};
          }
          config.options['help'] = merge(config.options['help'], {
            name: 'help',
            cascade: true,
            shortcut: 'h',
            description: 'Display help information',
            type: 'boolean',
            help: true
          });
        }
        if (!command.length && Object.keys(config.commands).length) {
          command = {
            name: 'help',
            description: "Display help information",
            main: {
              name: 'name',
              description: 'Help about a specific command'
            },
            help: true,
            route: path.resolve(__dirname, '../routes/help'), // config.help.route
            options: {
              'help': {
                disabled: true
              }
            }
          };
          config.commands[command.name] = merge(command, config.commands[command.name]);
        }
        return function() {
          handler.call(this, ...arguments);
          return config.description != null ? config.description : config.description = `No description yet for the ${config.name} command`;
        };
      }
    });
    this.register({
      configure_set: function({config, command}, handler) {
        if (!command.length) {
          return handler;
        }
        return function() {
          handler.call(this, ...arguments);
          return config.description != null ? config.description : config.description = `No description yet for the ${config.name} command`;
        };
      }
    });
    return parent.call(this, ...arguments);
  };
})(Parameters.prototype.init);

// ## Method `helping(params)`

// Determine if help was requested by returning zero to n commands if help is requested or null otherwise.

// * `params`: `[object] | object` The parameter object parsed from arguments, an object in flatten mode or an array in extended mode, optional.
// * Returns: `array | null` The formatted help to be printed.
Parameters.prototype.helping = function(params, options = {}) {
  var appconfig, commands, helping, leftover, search;
  params = clone(params);
  appconfig = this.confx().get();
  if (options.extended == null) {
    options.extended = appconfig.extended;
  }
  if (!options.extended) {
    if (!is_object_literal(params)) {
      throw error(["Invalid Arguments:", "`helping` expect a params object as first argument", "in flatten mode,", `got ${JSON.stringify(params)}`]);
    }
  } else {
    if (!(Array.isArray(params) && !params.some(function(cparams) {
      return !is_object_literal(cparams);
    }))) {
      throw error(["Invalid Arguments:", "`helping` expect a params array with literal objects as first argument", "in extended mode,", `got ${JSON.stringify(params)}`]);
    }
  }
  // Extract the current commands from the parameters arguments
  if (!options.extended) {
    if (params[appconfig.command] && !Array.isArray(params[appconfig.command])) {
      throw error(['Invalid Arguments:', `parameter ${JSON.stringify(appconfig.command)} must be an array in flatten mode,`, `got ${JSON.stringify(params[appconfig.command])}`]);
    }
    // In flatten mode, extract the commands from params
    commands = params[appconfig.command] || [];
  } else {
    commands = params.slice(1).map(function(cparams) {
      return cparams[appconfig.command];
    });
  }
  // Handle help command
  // if this is the help command, transform the leftover into a new command
  if (commands.length && appconfig.commands && appconfig.commands[commands[0]].help) {
    helping = true;
    // Note, when argv equals ['help'], there is no leftover and main is null
    leftover = !options.extended ? params[appconfig.commands[commands[0]].main.name] : params[1][appconfig.commands[commands[0]].main.name];
    if (leftover) {
      return leftover;
    } else {
      return [];
    }
  }
  // Handle help option:
  // search if the help option is provided and for which command it apply
  search = function(config, commands, params) {
    var command, cparams;
    cparams = !options.extended ? params : params.shift();
    // Search the help option
    helping = Object.values(config.options).filter(function(options) {
      return options.help;
    // Check if it is present in the parsed parameters
    }).some(function(options) {
      return cparams[options.name] != null;
    });
    if (helping) {
      if (options.extended && commands.length) {
        throw error(['Invalid Argument:', '`help` must be associated with a leaf command']);
      }
      return true;
    }
    if (!(commands != null ? commands.length : void 0)) {
      // Helping is not requested and there are no more commands to search
      return false;
    }
    command = commands.shift();
    if (options.extended && params.length === 0) {
      return false;
    }
    config = config.commands[command];
    return search(config, commands, params);
  };
  helping = search(appconfig, clone(commands), params);
  if (helping) {
    return commands;
  } else {
    return null;
  }
};

// ## Method `help(command)`

// Format the configuration into a readable documentation string.

// * `command`: `[string] | string` The string or array containing the command name if any, optional.
// * Returns: `string` The formatted help to be printed.
Parameters.prototype.help = function(commands = [], options = {}) {
  var _, appconfig, cmd, command, config, configs, content, description, has_help_command, has_help_option, i, j, k, l, len, len1, len2, len3, line, m, name, option, ref, ref1, ref2, ref3, ref4, shortcut, synopsis;
  if (typeof commands === 'string') {
    commands = commands.split(' ');
  }
  if (!Array.isArray(commands)) {
    throw error(['Invalid Help Arguments:', 'expect commands to be an array as first argument,', `got ${JSON.stringify(commands)}`]);
  }
  config = appconfig = this.confx().get();
  configs = [config];
  for (i = j = 0, len = commands.length; j < len; i = ++j) {
    command = commands[i];
    config = config.commands[command];
    if (!config) {
      throw error(['Invalid Command:', `argument "${commands.slice(0, i + 1).join(' ')}" is not a valid command`]);
    }
    configs.push(config);
  }
  // Init
  content = [];
  content.push('');
  // Name
  content.push('NAME');
  name = configs.map(function(config) {
    return config.name;
  }).join(' ');
  description = configs[configs.length - 1].description;
  content.push(`    ${name} - ${description}`);
  // Synopsis
  content.push('');
  content.push('SYNOPSIS');
  synopsis = [];
  for (i = k = 0, len1 = configs.length; k < len1; i = ++k) {
    config = configs[i];
    synopsis.push(config.name);
    // Find if there are options other than help
    if (Object.values(config.options).some(function(option) {
      return !option.help;
    })) {
      synopsis.push(`[${config.name} options]`);
    }
    // Is current config
    if (i === configs.length - 1) {
      // There are more subcommand
      if (Object.keys(config.commands).length) {
        synopsis.push(`<${appconfig.command}>`);
      } else if (config.main) {
        synopsis.push(`{${config.main.name}}`);
      }
    }
  }
  content.push('    ' + synopsis.join(' '));
  ref = configs.slice(0).reverse();
  // Options
  for (l = 0, len2 = ref.length; l < len2; l++) {
    config = ref[l];
    if (Object.keys(config.options).length || config.main) {
      content.push('');
      if (configs.length === 1) {
        content.push("OPTIONS");
      } else {
        content.push(`OPTIONS for ${config.name}`);
      }
    }
    if (Object.keys(config.options).length) {
      ref1 = Object.keys(config.options).sort();
      for (m = 0, len3 = ref1.length; m < len3; m++) {
        name = ref1[m];
        option = config.options[name];
        shortcut = option.shortcut ? `-${option.shortcut} ` : '';
        line = '    ';
        line += `${shortcut}--${option.name}`;
        line = pad(line, 28);
        if (line.length > 28) {
          content.push(line);
          line = ' '.repeat(28);
        }
        line += option.description || `No description yet for the ${option.name} option.`;
        if (option.required) {
          line += ' Required.';
        }
        content.push(line);
      }
    }
    if (config.main) {
      line = '    ';
      line += `${config.main.name}`;
      line = pad(line, 28);
      if (line.length > 28) {
        content.push(line);
        line = ' '.repeat(28);
      }
      line += config.main.description || `No description yet for the ${config.main.name} option.`;
      content.push(line);
    }
  }
  // Command
  config = configs[configs.length - 1];
  if (Object.keys(config.commands).length) {
    content.push('');
    content.push('COMMANDS');
    ref2 = config.commands;
    for (_ in ref2) {
      command = ref2[_];
      line = [`${command.name}`];
      line = pad(`    ${line.join(' ')}`, 28);
      if (line.length > 28) {
        content.push(line);
        line = ' '.repeat(28);
      }
      line += command.description || `No description yet for the ${command.name} command.`;
      content.push(line);
    }
    // Detailed command information
    if (options.extended) {
      ref3 = config.commands;
      for (_ in ref3) {
        command = ref3[_];
        content.push('');
        content.push(`COMMAND "${command.name}"`);
        // Raw command, no main, no child commands
        if (!Object.keys(command.commands).length && !((ref4 = command.main) != null ? ref4.required : void 0)) {
          line = `${command.name}`;
          line = pad(`    ${line}`, 28);
          if (line.length > 28) {
            content.push(line);
            line = ' '.repeat(28);
          }
          line += command.description || `No description yet for the ${command.name} command.`;
          content.push(line);
        }
        // Command with main
        if (command.main) {
          line = `${command.name} {${command.main.name}}`;
          line = pad(`    ${line}`, 28);
          if (line.length > 28) {
            content.push(line);
            line = ' '.repeat(28);
          }
          line += command.main.description || `No description yet for the ${command.main.name} option.`;
          content.push(line);
        }
        // Command with child commands
        if (Object.keys(command.commands).length) {
          line = [`${command.name}`];
          if (Object.keys(command.options).length) {
            line.push(`[${command.name} options]`);
          }
          line.push(`<${command.command}>`);
          content.push('    ' + line.join(' '));
          commands = Object.keys(command.commands);
          if (commands.length === 1) {
            content.push(`    Where command is ${Object.keys(command.commands)}.`);
          } else if (commands.length > 1) {
            content.push(`    Where command is one of ${Object.keys(command.commands).join(', ')}.`);
          }
        }
      }
    }
  }
  // Add examples
  config = configs[configs.length - 1];
  has_help_option = Object.values(config.options).some(function(option) {
    return option.name === 'help';
  });
  has_help_command = Object.values(config.commands).some(function(command) {
    return command.name === 'help';
  });
  has_help_option = true;
  content.push('');
  content.push('EXAMPLES');
  cmd = configs.map(function(config) {
    return config.name;
  }).join(' ');
  if (has_help_option) {
    line = pad(`    ${cmd} --help`, 28);
    if (line.length > 28) {
      content.push(line);
      line = ' '.repeat(28);
    }
    line += 'Show this message';
    content.push(line);
  }
  if (has_help_command) {
    line = pad(`    ${cmd} help`, 28);
    if (line.length > 28) {
      content.push(line);
      line = ' '.repeat(28);
    }
    line += 'Show this message';
    content.push(line);
  }
  content.push('');
  return content.join('\n');
};
