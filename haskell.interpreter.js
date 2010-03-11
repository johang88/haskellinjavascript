(function(interpreter, ast){
    interpreter.execute = function(ast) {
	env = new RootEnv();
	// Only fun defs atm
	for (i in ast.declarations) {
	    decl = ast.declarations[i];
	    env.patternBind(decl.pattern, new Closure(env, decl.expression));
	};
	env.bind("+", createPrimitive(env, ["a", "b"],
				      function(env) {
					  a = forceTo(env.lookup("a"), "ConstantThunk");
					  b = forceTo(env.lookup("b"), "ConstantThunk");
					  return new ConstantThunk(new Num(a.value.num+b.value.num));
				      }));
	env.bind("alert", createPrimitive(env, ["l"],
					  function(env) {
					      l = forceTo(env.lookup("l"), "ConstantThunk");
					      alert(l.value.num);
					      return new Data("()", []);
					  }));
	return env.lookup("main").force();
    };
    function createPrimitive(env, args, func) {
	expr = new Primitive(func);
	argsR = args.reverse();
	for (i in argsR) {
	    expr = new Lambda(new VariableBinding(argsR[i]), expr);
	};
	return new Closure(env, expr);
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
	ast = new Module([
			  new Variable(new VariableBinding("inc"),
				       new Lambda(new VariableBinding("x"),
						  new Application(new Application(new VariableLookup("+"),
										  new VariableLookup("x")),
								  new Constant(new Num(1))))),
			  new Variable(new VariableBinding("inc2"),
				       new Lambda(new VariableBinding("x"),
						  new Application(new VariableLookup("inc"),
								  new Application(new VariableLookup("inc"),
										  new VariableLookup("x"))))),
			  new Variable(new VariableBinding("main"),
				       new Application(new VariableLookup("alert"),
						       new Application(new VariableLookup("inc2"),
								       new Constant(new Num(2)))))
			   ]);
	interpreter.execute(ast);
    };

    /*
      data Module = Module [Declaration]
    */
    Module = function(declarations) {
	this.declarations = declarations;
    };
	
    /*
      data Expression = Constant Value
                      | Lambda Pattern Expression
                      | Application Expression Expression
        	      | Let Pattern Expression Expression
        	      | Case Expression [(Pattern, Expression)]
                      | VariableLookup Identifier
        	      | PrimitiveExpr Function
    */
    Constant = function(value) {
	this.type ="Constant";
	this.value = value;

	this.eval = function(env) {
	    return new ConstantThunk(this.value);
	};
    };
    Lambda = function(pattern, expression) {
	this.type = "Lambda";
	this.pattern = pattern;
	this.expression = expression;

	this.eval = function(env) {
	    return new Closure(env, this);
	};
    };
    Application = function(func, arg) {
	this.type = "Application";
	this.func = func;
	this.arg = arg;
	this.eval = function(env) {
	    clos = this.func.eval(env);
	    x = clos.expression.pattern;
	    body = clos.expression.expression;
	    return body.eval(clos.env.substitute(x, new Closure(env, this.arg)));
	};
    };
    Let = function(pattern, def, expr) {
	this.type = "Let";
	this.pattern = pattern;
	this.def = def;
	this.expr = expr;
	this.eval = function(env) {
	    return this.expr.eval(env.substitute(this.pattern, new Closure(env, this.def)));
	};
    };
    Case = function(expr, cases) {
	this.type = "Case";
	this.expr = expr;
	this.cases = cases;
	this.eval = function(env) {
	    expr = new Closure(env, this.expr);
	    for (i in this.cases) {
		newEnv = env.derive();
		if (this.cases[i][0].match(newEnv, expr)) {
		    return new Closure(this.cases[i][1], newEnv);
		};
	    };
	};
	alert("No matching clause");
    };
    VariableLookup = function(identifier) {
	this.type = "VariableLookup";
	this.identifier = identifier;
	this.eval = function(env) {
	    return env.lookup(this.identifier);
	};
    };
    Primitive = function(func) {
	this.type="Primitive";
	this.func = func;
	this.eval = function(env) {
	    return this.func(env);
	};
    };

    /*
      data Value = Num Int
    */
    Num = function(num) {
	this.type = "Num";
	this.num = num;
    };

    /*
      data Declaration = Variable Pattern Expression
    */
    Variable = function(pattern, expression) {
	this.type = "Variable";
	this.pattern = pattern;
	this.expression = expression;
    };

    /*
      Pattern = Constructor Identifier [Pattern]
              | VariableBinding Identifier
	      | Combined Identifier Pattern
	      | Constant Value
    */
    Constructor = function(identifier, patterns) {
	this.type = "Constructor";
	this.identifier = identifier;
	this.patterns = patterns;
	this.match = function(env, expr) {
	    while(expr.type!="Data") {
		expr=expr.force();
	    };
	    if (this.identifier!=expr.identifier) {
		return false;
	    };
	    for (i in this.patterns) {
		if (!this.patterns[i].match(env, expr.thunks[i])) {
		    return false;
		};
	    };
	    return true;
	};

	this.vars = function() {
	    vars=[];
	    for (i in this.patterns) {
		vars=vars.concat(this.patterns[i].vars());
	    };
	};
    };
    VariableBinding = function(identifier) {
	this.type = "VariableBinding";
	this.identifier = identifier;
	this.match = function(env, expr) {
	    env.bind(this.identifier, expr);
	    return true;
	};
	this.vars = function() {
	    return [this.identifier];
	};
    };
    Combined = function(identifier, pattern) {
	this.type = "Combined";
	this.identifier = identifier;
	this.pattern = pattern;
	this.match = function(env, expr) {
	    env.bind(this.identifier, expr);
	    return this.pattern.match(env, expr);
	};
	this.vars = function() {
	    return [this.identifier].concat(this.pattern.vars());
	};
    };
    ConstantPattern = function(value) {
	this.type = "ConstantPattern";
	this.value = value;
	this.match = function(env, expr) {
	    while(expr.type!="Constant") {
		expr = expr.force();
	    };
	    return (this.value==expr.value);
	};
	this.vars = function() {
	    return [];
	};
    };

     // Live data
    /*
     data Env = RootEnv [(Identifier, Pattern, Thunk)|(Identifier, Thunk)]
              | ChildEnv [(Identifier, Pattern, Thunk)|(Identifier, Thunk)] Env
    */
    RootEnv = function() {
	this.type = "RootEnv";
	this.env = {};
	this.substitute = function(pattern, expression) {
	    newEnv = this.derive();
	    newEnv.patternBind(pattern, expression);
	    return newEnv;
	};
	this.derive = function() {
	    return new ChildEnv(this);
	};
	this.lookup = function(identifier) {
	    if (this.env[identifier]==undefined) {
		return undefined;
	    };
	    found = this.env[identifier];
	    if (found.type == "unforced") {
		if (!found[0].match(this, found[1])) {
		    alert("Unrefutable pattern failed");
		};
	    };
	    return this.env[identifier];
	};
	this.patternBind = function(pattern, expression) {
	    vars = pattern.vars();
	    for (i in vars) {
		this.env[vars[i]] = [pattern, expression];
		this.env[vars[i]].type = "unforced";
	    }
	};
	this.bind = function(identifier, expr) {
	    this.env[identifier] = expr;
	};
    };
    ChildEnv = function(parent) {
	this.type = "ChildEnv";
	this.parent = parent;
	this.env = {};
	this.substitute = function(pattern, expression) {
	    newEnv = this.derive();
	    newEnv.patternBind(pattern, expression);
	    return newEnv;
	};
	this.derive = function() {
	    return new ChildEnv(this);
	};
	this.patternBind = function(pattern, expression) {
	    vars = pattern.vars();
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
		return this.parent.lookup(identifier);
	    };
	    found = this.env[identifier];
	    if (found.type == "unforced") {
		if (!found[0].match(this, found[1])) {
		    alert("Unrefutable pattern failed");
		};
	    };
	    return this.env[identifier];
	};
    };

    /*
     data Thunk = Closure Env Expression
                | ConstantThunk Value
	        | Data Identifier [Thunk]
	        | Primitive Env Function
    */
    Closure = function(env, expression) {
	this.type = "Closure";
	this.env = env;
	this.expression = expression;
	
	this.force = function() {
	    // Forcing a closure is the same as evaluating its expression under the closures env
	    return this.expression.eval(this.env);
	};
    };
    ConstantThunk = function(value) {
	this.type = "ConstantThunk";
	this.value = value;
	this.force = function() {
	    return this;
	};
    };
    Data = function(identifier, thunks) {
	this.type = "Data";
	this.identifier = identifier;
	this.thunks = thunks;
	
	this.force = function() {
	    // Data is already forced...
	    return this;
	};
    }; 
})(haskell.interpreter, haskell.ast);