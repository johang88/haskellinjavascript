(function(primitives, ast, interpreter){

    var showResult = function(result) {
	if (result.type == "Data") {
	    var str = result.identifier;
	    var op = " ";
            
	    if (str == "I#") {
		str = "";
	    } else if (str == ":") {
		str = "";
		op = ",";
	    }
            
	    if (result.ptrs) {
		var first = true;
		for (var i = 0; i < result.ptrs.length; i++) {
		    if (str.length == 0 && first) {
			str = showResult(result.ptrs[i].dereference());
			if (typeof str.str != "undefined") 
			    str = str.str;
			first = false;
		    } else {
			var res = showResult(result.ptrs[i].dereference());
			if (typeof res.str != "undefined")
			    res = res.str;
			str = str + op + res;
		    }
		}
	    }
            
	    return { str: str, isList: op == "," };
	} if (result.force) {
	    return result.force();
	} else if (result.ptrs) {
	    return result.ptrs[0].dereference();
	} else {
	    return result; 
	}
    };
    

    primitives.initHiji = function(env) {
	env.bind("hijiContinuation#", primitives.createPrimitive(env, 1,
						      function(env, args) {
							  return env;
						      }));

	// hijiOutputLine# :: IO ()
	env.bind("hijiOutputLine#", primitives.createPrimitive(env, 1, 
						    function(env, args) {
							var arg = args[0];
							var result = showResult(arg);
							if (result.isList) {
							    result = result.str;
							    result = result.substring(0, result.length - 3);
							    result = "[" + result + "]";
							} else if (typeof result.str != "undefined") {
							    result = result.str;
							}
							printArea.append($("<li class='output'></li>").text(result.toString()));
						    }));
    };
})(haskell.primitives, haskell.ast, haskell.interpreter);