(function($){
    var evaluateHaskell = function(line, env)
    {
        return "Not implemented";
    };
    var makeModules = function(modules){
        return "<ul class='modules'><li>" + modules.join("</li><li>") + "</li></ul>";
    };
    var makeEntered = function(modules, entered){
        return $("<li class='entered'>" + makeModules(modules) + "<span class='line'>" + entered + "</span></li>");1
    };
    var makeResponse = function(response){

    };
    var makeInput = function(modules){
        return "<li class='input'>" + makeModules(modules) + "<input type='text'></li>";
    };
    var makeOutput = function(output) {
        return $("<li class='output'></li>").text(output);
    };
    $.fn.startHiji = function() {
        var modules = new Array();
        modules[0] = "Prelude";
        modules[1] = "Control.Monad";
        this.html("<ol>" + makeInput(modules) + "</ol>");
        this.keypress(function(e){
            if (e.keyCode=='13'){
                var input = $('input', this);
                var line = input.attr("value");
                input.attr("value","");
                var newLine = makeEntered(modules, line);
                var output = makeOutput(evaluateHaskell(line,{}));
                $('.input', this).after(output).replaceWith(newLine);
                $("ol",this).append(makeInput(modules));
            }
        });
    };
})(jQuery);