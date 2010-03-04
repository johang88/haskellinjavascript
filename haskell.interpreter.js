(function(interpreter, ast){
    interpreter.eval = function(closure) {
	closure.force();
    };
    
    interpreter.substitute = function(env, v, expr) {
	env[v] = expr;
	return env;
    };
    
    interpreter.lookup = function(env, identifier) {
	return env[identifier];
    };

    Closure = function(env, expr) {
	this.env = env;
	this.expr = expr;
	this.force = function()
	{
	    if (this.expr instanceof ast.Application) {
		closure = interpreter.eval(new Closure(env, expr.func));
		if (closure instanceof Closure){
		    cl = closure.getEnv();
		    argname = closure.argName();
		    body = closure.body();
		    return interpreter.eval(interpreter.substitute(cl, argname, expr.expr), body);
		}
		else {
		    return closure(expr.expr);
		}
		
	    }
	    else if (expr instanceof ast.ConstantExpression) {
		return new Constant(expr.value);
	    }
	    else if (expr instanceof ast.VariableLookup) {
		return interpreter.lookup(env, expr.identifier);
	    }
	    else if (expr instanceof Closure) {
		return interpreter.eval(expr.getEnv(), expr.body());
	    }
	};
    };

    Constant = function(constant) {
	this.constant = constant;
    };

    interpreter.execute = function(ast) {
	env = {};
	// Only fun defs atm
	for (i in ast.declarations) {
	    expr = ast.declarations[i];
	    env[expr.identifier] = new Closure(env, new haskell.ast.Lambda(expr.patterns, expr.expression));
	};
	env["+"] = function(r) {
	    return function(l) { return ast.Num(r.num+l.num); };
	};
	return interpreter.eval(env, env["main"]);
    }

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
	    x = clos.arg();
	    body = clos.body();
	    env = clos.env();
	    return body.eval(env.substitute(x, this.arg));
	};
    };
    Let = function(pattern, def, expr) {
	this.type = "Let";
	this.pattern = pattern;
	this.def = def;
	this.expr = expr;
    };
    Case = function(expr, cases) {
	this.type = "Case";
	this.expr = expr;
	this.cases = cases;
    };
    VariableLookup = function(identifier) {
	this.type = "VariableLookup";
	this.identifier = identifier;
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
    };
    VariableBinding = function(identifier) {
	this.type = "VariableBinding";
	this.identifier = identifier;
    };
    Combined = function(identifier, pattern) {
	this.type = "Combined";
	this.identifier = identifier;
	this.pattern = pattern;	
    };
    ConstantPattern = function(value) {
	this.type = "ConstantPattern";
	this.value = value;
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
	    vars = pattern.vars();
	    for (i in vars) {
		this.env[vars[i]] = [pattern, expression];
		this.env[vars[i]].type = "unforced";
	    }
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
    };
    ChildEnv = function(parent) {
	this.type = "ChildEnv";
	this.parent = parent;
	this.env = {};
	this.substitute = function(pattern, expression) {
	    vars = pattern.vars();
	    for (i in vars) {
		this.env[vars[i]] = [pattern, expression];
		this.env[vars[i]].type = "unforced";
	    };
	};
	this.derive = function() {
	    return new ChildEnv(this);
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
	    // Forcing a closure is the same as evaluating it's expression under the closures env
	    return this.expression.eval(this.env);
	};

	this.arg = function() {
	    return this.expression.pattern;
	};

	this.body = function() {
	    return this.expression.expression;
	};
    };
    ConstantThunk = function(value) {
	this.type = "Constant";
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
    Primitive = function(env, function) {
	this.type = "Primitive";
	this.env = env;
	this.function = function;

	this.force = function() {
	    return this.function(env);
	};
    };
})(haskell.interpreter, haskell.ast);