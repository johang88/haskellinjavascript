(function(interpreter, ast){
    interpreter.primitives = function(env) {
	env.bind("+", createPrimitive(env, ["a", "b"],
				      function(env) {
					  var a = forceTo(env.lookup("a"), "ConstantThunk");
					  var b = forceTo(env.lookup("b"), "ConstantThunk");
					  return new interpreter.ConstantThunk(new ast.Num(a.value.num+b.value.num));
				      }));
    env.bind("*", createPrimitive(env, ["a", "b"],
				      function(env) {
					  var a = forceTo(env.lookup("a"), "ConstantThunk");
					  var b = forceTo(env.lookup("b"), "ConstantThunk");
					  return new interpreter.ConstantThunk(new ast.Num(a.value.num*b.value.num));
				      }));
	env.bind("alert", createPrimitive(env, ["l"],
					  function(env) {
					      var l = forceTo(env.lookup("l"), "ConstantThunk");
					      alert(l.value.num);
					      return new interpreter.Data("()", []);
					  }));
    };

    interpreter.execute = function(astt) {
	var env = new interpreter.RootEnv();
	// Only fun defs atm
	for (i in astt.declarations) {
	    var decl = astt.declarations[i];
	    env.patternBind(decl.pattern, new interpreter.Closure(env, decl.expression));
	};
	interpreter.primitives(env);
	return env.lookup("main").force();
    };


    interpreter.eval = function(astt, env) {
	return (new interpreter.Closure(env, astt)).force();
    };

    function createPrimitive(env, args, func) {
	var expr = new ast.Primitive(func);
	var argsR = args.reverse();
	for (i in argsR) {
	    expr = new ast.Lambda(new ast.VariableBinding(argsR[i]), expr);
	};
	return new interpreter.Closure(env, expr);
    };
    function forceTo(thunk, type) {
	while(thunk.type!=type) {
	    thunk=thunk.force();
	};
	return thunk;
    };


    interpreter.test = function() {
	// inc  = \x -> x + 1
	// inc2 = \x -> inc (inc x)
	// main = print (inc2 2)
	// map = (\f -> let map' = (\l -> case l of
        //                                (x:xs) -> f x : map' xs
	//                                []     -> []
	//                          ) in map')
	var astt = new ast.Module([
				   new ast.Variable(new ast.VariableBinding("inc"),
						    new ast.Lambda(new ast.VariableBinding("x"),
								   new ast.Application(new ast.Application(new ast.VariableLookup("+"),
													   new ast.VariableLookup("x")),
										       new ast.Constant(new ast.Num(1))))),
				   new ast.Variable(new ast.VariableBinding("inc2"),
						    new ast.Lambda(new ast.VariableBinding("x"),
								   new ast.Application(new ast.VariableLookup("inc"),
										       new ast.Application(new ast.VariableLookup("inc"),
													   new ast.VariableLookup("x"))))),
				   new ast.Variable(new ast.VariableBinding("main"),
						    new ast.Application(new ast.VariableLookup("alert"),
									new ast.Application(new ast.VariableLookup("inc2"),
											    new ast.Constant(new ast.Num(2)))))
				   ]);
	interpreter.execute(astt);
    };

 

     // Live data
    /*
     data Env = RootEnv [(Identifier, Pattern, Thunk)|(Identifier, Thunk)]
              | ChildEnv [(Identifier, Pattern, Thunk)|(Identifier, Thunk)] Env
    */
    interpreter.Env = function() {
	this.env = {};
	this.substitute = function(pattern, expression) {
	    var newEnv = this.derive();
	    newEnv.patternBind(pattern, expression);
	    return newEnv;
	};
	this.derive = function() {
	    return new interpreter.ChildEnv(this);
	};
	this.patternBind = function(pattern, expression) {
	    var vars = pattern.vars();
	    for (i in vars) {
		this.env[vars[i]] = [pattern, expression];
		this.env[vars[i]].type = "unforced";
	    }
	};
	this.bind = function(identifier, expr) {
	    this.env[identifier] = expr;
	};
	this.lookup = function(identifier) {
	    if (this.env[identifier]==undefined) {
		return this.onUndefined(identifier);
	    };
	    var found = this.env[identifier];
	    if (found.type == "unforced") {
		if (!found[0].match(this, found[1])) {
		    alert("Unrefutable pattern failed");
		};
	    };
	    return this.env[identifier];
	};
	this.onUndefined = function(identifier) {
	    return undefined;
	};
    };

    interpreter.RootEnv = function() {
	this.type = "RootEnv";
    };
    interpreter.ChildEnv = function(parent) {
	this.type = "ChildEnv";
	this.parent = parent;
	this.onUndefined = function(identifier) {
	    return this.parent.lookup(identifier);
	};
    };

    interpreter.RootEnv.prototype = new interpreter.Env();
    interpreter.ChildEnv.prototype = new interpreter.Env();
    
    interpreter.RootEnv.prototype.constructor = interpreter.RootEnv;
    interpreter.ChildEnv.prototype.constructor = interpreter.ChildEnv;

    /*
     data Thunk = Closure Env Expression
                | ConstantThunk Value
	        | Data Identifier [Thunk]
	        | Primitive Env Function
    */
    interpreter.Closure = function(env, expression) {
	this.type = "Closure";
	this.env = env;
	this.expression = expression;
	
	this.force = function() {
	    // Forcing a closure is the same as evaluating its expression under the closures env
	    return this.expression.eval(this.env);
	};
    };
    interpreter.ConstantThunk = function(value) {
	this.type = "ConstantThunk";
	this.value = value;
	this.force = function() {
	    return this;
	};
    };
    interpreter.Data = function(identifier, thunks) {
	this.type = "Data";
	this.identifier = identifier;
	this.thunks = thunks;
	
	this.force = function() {
	    // Data is already forced...
	    return this;
	};
    };
})(haskell.interpreter, haskell.ast);
