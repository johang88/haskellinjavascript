var ENTER = '13';
var UP    = '38';
var DOWN  = '40';
var is_module_loaded = false;
var modules = new Array();


var commands = new Array();
commands[":l"]    = "LOAD";
commands[":load"] = "LOAD";
commands[":h"]    = "HELP";
commands[":help"] = "HELP";

(function($){

    var evaluateHaskell = function(line, env)
    {
        var line_ = '{' + line + '}';
        ast = haskell.parser.parse(line_).ast;
        if (ast == undefined){
            return "Syntax Error";
        }
        console.log("%o", ast);
        return haskell.interpreter.eval(ast, env);
    };
    var makeModules = function(modules){
        return "<ul class='modules'><li>" + modules.join("</li><li>") + "</li></ul>";
    };
    var makeEntered = function(modules, entered){
        return $("<li class='entered'>" + makeModules(modules) + "<span class='line'>" + entered + "</span></li>");
    };
    var makeResponse = function(response){

    };
    var makeInput = function(modules){
            return "<li class='input' id='inputTest'>" + makeModules(modules) + "<input type='text' name='inputBox' id='inbox'></li>";
    };
    var makeOutput = function(output) {
	console.log("%o", output);
        return $("<li class='output'></li>").text(output.toString());
    };
    
    $.fn.startHiji = function() {

        //var modules = new Array();
        var hist = new Array();
        
        // history
        var hiss = new historry;
        // load history from cookie
        hiss_cookie = $.cookie("hiss");
        if(hiss_cookie != null){
            hiss.history_array = JSON.parse(hiss_cookie);
        }

        var env = new haskell.interpreter.RootEnv();
        haskell.primitives.init(env);
        
        //  ladda prelude
        load_module('Prelude.hs');
        modules[0] = "Prelude";
        this.html("<ol>" + makeInput(modules) + "</ol>");

        $("input:text:visible:first").focus();
        
        this.keydown(function(e){
            var input = $('input', this);
            var line = input.attr("value");
            if(e.keyCode==UP){
                input.attr("value", hiss.older(line));
            }
            if(e.keyCode==DOWN){
                input.attr("value", hiss.newer(line));
            }
            if (e.keyCode==ENTER){

                // history
                hiss.addHistory(line);
                $.cookie("hiss", JSON.stringify(hiss.history_array), {expires: 3 });              
                input.attr("value","");

                if(isCommand(line)){
                    runCommand(line, input, line);
                }else
                {
                    try {
                        var newLine = makeEntered(modules, line);
                        var output = makeOutput(evaluateHaskell(line, env));
                        $('.input', this).after(output).replaceWith(newLine);
                        $("ol",this).append(makeInput(modules));
                    }
                    catch(e) {
                        console.log("%o", e);
                    };
                }

                //set focus
                $("input:text:visible:first").focus();
            }
        });

        // load a module
        function load_module(module){
            is_module_loaded = false;
            jQuery.ajax({
                async : false,
                url : module,
                success: function(prelude_data){
                    console.log(prelude_data);
                    try {
                            var ast = haskell.parser.parse(prelude_data);
                            console.log("%o", ast);
                            if (ast.ast == undefined) {
                                console.log("Syntax Error");
                            }
                        else {
                            haskell.interpreter.prepare(ast.ast, env);
                            is_module_loaded = true;
                        }
                    } catch(e) {
                        console.log("%o", e);
                   }
                }
            });
        }

        function isCommand(l){
            var line = trim(l);
            if(line.charAt(0) == ':')
                return true
            else
                return false
        }
        
        function runCommand(i, input2, line){
            var input   = trim(i);
            var command = input.indexOf(" ") != -1 ? input.substr(0, input.indexOf(" ")) : input;
            // load module
            if(commands[command] == "LOAD"){
                var arg     = trim(input.substr(command.length)); 
                var module_name = arg.substr(0, arg.lastIndexOf('.'));  
                load_module(arg);
                if(is_module_loaded){
                    var module_already_in_modules = false;
                    for(x in modules){
                        if(modules[x] == module_name)
                            module_already_in_modules = true;
                    }
                    if(module_already_in_modules == false){
                        var newLine = makeEntered(modules, line);
                        var output = makeOutput("Module " + module_name +" loaded");
                        $('.input').after(output).replaceWith(newLine);
                        modules.push(module_name);
                        $("ol").append(makeInput(modules));
                    }else{
                        var newLine = makeEntered(modules, line);
                        var output = makeOutput("Module " + module_name + " already loaded");
                        $('.input').after(output).replaceWith(newLine);
                        $("ol").append(makeInput(modules));
                    }
                }else{
                        var newLine = makeEntered(modules, line);
                        var output = makeOutput("Module " + module_name + " not found");
                        $('.input').after(output).replaceWith(newLine);
                        $("ol").append(makeInput(modules));
                }
            }else if(commands[command] == "HELP"){
                var newLine     = makeEntered(modules, line);
                var output_row  = new Array();
                output_row.push(makeOutput("Help"));
                output_row.push(makeOutput(" "));
                output_row.push(makeOutput("Commands:"));
                output_row.push(makeOutput(":l [Module]  ... load a module"));
                var str = "$('.input')";
                for (var i = output_row.length-1; i>=0; i--){
                    str += ".after(" + output_row[i] + ")";
 //                   $('.input').after(output_row[i]).after(output).replaceWith(newLine);
                }
                str += ".replaceWith(newLine);";
                alert(str);
                eval(str);
               // var output  = makeOutput("HELP HELP HELP" + "<br>" + "asdas");
              //  $('.input').after(output1).after(output).replaceWith(newLine);
             //   $('.input').after(output).replaceWith(newLine);
             //   $('.input').after(output).replaceWith(newLine);
                $("ol").append(makeInput(modules));
            }
        }
    };

})(jQuery);

function trim(str){
    return str.replace(/^\s+|\s+$/g,"");
}

// historry-class with nice name
// !!!WARNING!!! NICE NAME. conflict with javascript
historry = function(input){
    this.pointer = -1;
    this.history_array = new Array();
    this.active_value = "";

    this.addHistory = function(input){
        this.history_array.unshift(input);
        this.pointer = -1;
    };

    this.updateHistory = function(input){
        this.history_array[this.pointer] = input;
    }

    this.older = function(input){

        if(this.pointer == -1){
            this.active_value = input;
        }else{
            this.updateHistory(input);
        }

        this.pointer++;
        if(this.pointer >= this.history_array.length){
            this.pointer = this.history_array.length-1
        }
        return this.history_array[this.pointer];
    };

    this.newer = function(input){

        if(this.pointer == -1){
            this.active_value = input;
        }else{
            this.updateHistory(input);
        }

        this.pointer--;
        if(this.pointer < 0){
            this.pointer = -1
            return this.active_value;
        }
        return this.history_array[this.pointer];
    };

};



