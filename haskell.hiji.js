(function($){
    var evaluateHaskell = function(line, env)
    {
        return haskell.parser.parse(line);
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
        return "<li class='input'>" + makeModules(modules) + "<input type='text' name='inputBox'></li>";
    };
    var makeOutput = function(output) {
	console.log("%o", output);
        return $("<li class='output'></li>").text(output.ast.toString());
    };

    $.fn.startHiji = function() {
        var modules = new Array();
        var hist = new Array();
        
        // history
        var hiss = new historry;
        
        modules[0] = "Prelude";
        modules[1] = "Control.Monad";
        this.html("<ol>" + makeInput(modules) + "</ol>");

        
        // pressing keyUP and keyDown
        // history-related
        document.onkeydown = function(e){
            var input = $('input', this);
            var line = input.attr("value");
            // keyUp
            if(e.keyCode=='38'){
                input.attr("value", hiss.older());
            }
            if(e.keyCode=='40'){
                input.attr("value", hiss.newer());
            }
        }

        this.keypress(function(e){
            if (e.keyCode=='13'){
                var input = $('input', this);
                var line = input.attr("value");
                input.attr("value","");
                var newLine = makeEntered(modules, line);
                var output = makeOutput(evaluateHaskell(line,{}));
                $('.input', this).after(output).replaceWith(newLine);
                $("ol",this).append(makeInput(modules));

                hiss.addHistory(line);
            }
        });
    };
})(jQuery);


// historry-class with nice name
// !!!WARNING!!! NICE NAME
historry = function (){
    this.pointer = 0;
    this.history_array = new Array();
    this.addHistory = function(input){
        this.history_array.unshift(input);
        this.pointer = -1;
    };

    this.older = function(){
        this.pointer++;
        if(this.pointer >= this.history_array.length){
            this.pointer = this.history_array.length-1
        }
        return this.history_array[this.pointer];
    };

    this.newer = function(){
        this.pointer--;
        if(this.pointer < 0){
            this.pointer = 0
            return "";
        }
        return this.history_array[this.pointer];
    };
};
