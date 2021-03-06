
## Plugin "help"

    # Dependencies
    path = require 'path'
    pad = require 'pad'
    error = require '../utils/error'
    {clone, is_object_literal, merge} = require 'mixme'
    # Parameters & plugins
    Parameters = require '../Parameters'
    require '../plugins/config'

    Parameters::init = ( (parent) ->
      ->
        @register configure_set: ({config, command}, handler) ->
          return handler if command.length
          config.commands ?= {}
          if not command.length
            config.description ?= 'No description yet'
          # No "help" option for command "help"
          if not command.length or not config.help
            config.options ?= {}
            config.options['help'] = merge config.options['help'],
              name: 'help'
              cascade: true
              shortcut: 'h'
              description: 'Display help information'
              type: 'boolean'
              help: true
          if not command.length and Object.keys(config.commands).length
            command =
              name: 'help'
              description: "Display help information"
              main:
                name: 'name'
                description: 'Help about a specific command'
              help: true
              route: path.resolve __dirname, '../routes/help' # config.help.route
              options:
                'help': disabled: true
            config.commands[command.name] = merge command, config.commands[command.name]
          ->
            handler.call @, arguments...
            config.description ?= "No description yet for the #{config.name} command"
        @register configure_set: ({config, command}, handler) ->
          return handler unless command.length
          ->
            handler.call @, arguments...
            config.description ?= "No description yet for the #{config.name} command"
        parent.call @, arguments...
    )(Parameters::init)

## Method `helping(params)`

Determine if help was requested by returning zero to n commands if help is requested or null otherwise.

* `params`: `[object] | object` The parameter object parsed from arguments, an object in flatten mode or an array in extended mode, optional.
* Returns: `array | null` The formatted help to be printed.

    Parameters::helping = (params, options={}) ->
      params = clone params
      appconfig = @confx().get()
      options.extended ?= appconfig.extended
      unless options.extended
        throw error [
          "Invalid Arguments:"
          "`helping` expect a params object as first argument"
          "in flatten mode,"
          "got #{JSON.stringify params}"
        ] unless is_object_literal params
      else
        throw error [
          "Invalid Arguments:"
          "`helping` expect a params array with literal objects as first argument"
          "in extended mode,"
          "got #{JSON.stringify params}"
        ] unless Array.isArray(params) and not params.some (cparams) -> not is_object_literal cparams
      # Extract the current commands from the parameters arguments
      unless options.extended
        throw error [
          'Invalid Arguments:'
          "parameter #{JSON.stringify appconfig.command} must be an array in flatten mode,"
          "got #{JSON.stringify params[appconfig.command]}"
        ] if params[appconfig.command] and not Array.isArray params[appconfig.command]
        # In flatten mode, extract the commands from params
        commands = params[appconfig.command] or []
      else
        commands = params.slice(1).map (cparams) ->
          cparams[appconfig.command]
      # Handle help command
      # if this is the help command, transform the leftover into a new command
      if commands.length and appconfig.commands and appconfig.commands[commands[0]].help
        helping = true
        # Note, when argv equals ['help'], there is no leftover and main is null
        leftover = unless options.extended
        then params[appconfig.commands[commands[0]].main.name]
        else params[1][appconfig.commands[commands[0]].main.name]
        return if leftover then leftover else []
      # Handle help option:
      # search if the help option is provided and for which command it apply
      search = (config, commands, params) ->
        cparams = unless options.extended then params else params.shift()
        helping = Object.values(config.options)
        # Search the help option
        .filter (options) -> options.help
        # Check if it is present in the parsed parameters
        .some (options) -> cparams[options.name]?
        if helping
          throw error [
            'Invalid Argument:'
            '`help` must be associated with a leaf command'
          ] if options.extended and commands.length
          return true
        # Helping is not requested and there are no more commands to search
        return false unless commands?.length
        command = commands.shift()
        return false if options.extended and params.length is 0
        config = config.commands[command]
        search config, commands, params
      helping = search appconfig, clone(commands), params
      if helping then commands else null

## Method `help(command)`

Format the configuration into a readable documentation string.

* `command`: `[string] | string` The string or array containing the command name if any, optional.
* Returns: `string` The formatted help to be printed.
    
    Parameters::help = (commands=[], options={}) ->
      commands = commands.split ' ' if typeof commands is 'string'
      throw error [
        'Invalid Help Arguments:'
        'expect commands to be an array as first argument,'
        "got #{JSON.stringify commands}"
      ] unless Array.isArray commands
      config = appconfig = @confx().get()
      configs = [config]
      for command, i in commands
        config = config.commands[command]
        throw error [
          'Invalid Command:'
          "argument \"#{commands.slice(0, i+1).join ' '}\" is not a valid command"
        ] unless config
        configs.push config
      # Init
      content = []
      content.push ''
      # Name
      content.push 'NAME'
      name = configs.map((config) -> config.name).join ' '
      description = configs[configs.length-1].description
      content.push "    #{name} - #{description}"
      # Synopsis
      content.push ''
      content.push 'SYNOPSIS'
      synopsis = []
      for config, i in configs
        synopsis.push config.name
        # Find if there are options other than help
        if Object.values(config.options).some((option) -> not option.help)
          synopsis.push "[#{config.name} options]"
        # Is current config
        if i is configs.length - 1
          # There are more subcommand
          if Object.keys(config.commands).length
            synopsis.push "<#{appconfig.command}>"
          else if config.main
            synopsis.push "{#{config.main.name}}"
      content.push '    ' + synopsis.join ' '
      # Options
      for config in configs.slice(0).reverse()
        if Object.keys(config.options).length or config.main
          content.push ''
          if configs.length is 1
            content.push "OPTIONS"
          else
            content.push "OPTIONS for #{config.name}"
        if Object.keys(config.options).length
          for name in Object.keys(config.options).sort()
            option = config.options[name]
            shortcut = if option.shortcut then "-#{option.shortcut} " else ''
            line = '    '
            line += "#{shortcut}--#{option.name}"
            line = pad line, 28
            if line.length > 28
              content.push line
              line = ' '.repeat 28
            line += option.description or "No description yet for the #{option.name} option."
            line += ' Required.' if option.required
            content.push line
        if config.main
          line = '    '
          line += "#{config.main.name}"
          line = pad line, 28
          if line.length > 28
            content.push line
            line = ' '.repeat 28
          line += config.main.description or "No description yet for the #{config.main.name} option."
          content.push line
      # Command
      config = configs[configs.length - 1]
      if Object.keys(config.commands).length
        content.push ''
        content.push 'COMMANDS'
        for _, command of config.commands
          line = ["#{command.name}"]
          line = pad "    #{line.join ' '}", 28
          if line.length > 28
            content.push line
            line = ' '.repeat 28
          line += command.description or "No description yet for the #{command.name} command."
          content.push line
        # Detailed command information
        if options.extended then for _, command of config.commands
          content.push ''
          content.push "COMMAND \"#{command.name}\""
          # Raw command, no main, no child commands
          if not Object.keys(command.commands).length and not command.main?.required
            line = "#{command.name}"
            line = pad "    #{line}", 28
            if line.length > 28
              content.push line
              line = ' '.repeat 28
            line += command.description or "No description yet for the #{command.name} command."
            content.push line
          # Command with main
          if command.main
            line = "#{command.name} {#{command.main.name}}"
            line = pad "    #{line}", 28
            if line.length > 28
              content.push line
              line = ' '.repeat 28
            line += command.main.description or "No description yet for the #{command.main.name} option."
            content.push line
          # Command with child commands
          if Object.keys(command.commands).length
            line = ["#{command.name}"]
            if Object.keys(command.options).length
              line.push "[#{command.name} options]"
            line.push "<#{command.command}>"
            content.push '    ' + line.join ' '
            commands = Object.keys command.commands
            if commands.length is 1
              content.push "    Where command is #{Object.keys command.commands}."
            else if commands.length > 1
              content.push "    Where command is one of #{Object.keys(command.commands).join ', '}."
      # Add examples
      config = configs[configs.length - 1]
      has_help_option = Object.values(config.options).some (option) -> option.name is 'help'
      has_help_command = Object.values(config.commands).some (command) -> command.name is 'help'
      has_help_option = true
      content.push ''
      content.push 'EXAMPLES'
      cmd = configs.map((config) -> config.name).join  ' '
      if has_help_option
        line = pad "    #{cmd} --help", 28
        if line.length > 28
          content.push line
          line = ' '.repeat 28
        line += 'Show this message'
        content.push line
      if has_help_command
        line = pad "    #{cmd} help", 28
        if line.length > 28
          content.push line
          line = ' '.repeat 28
        line += 'Show this message'
        content.push line
      content.push ''
      content.join '\n'
