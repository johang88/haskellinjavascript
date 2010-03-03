(function(interpreter, ast){
    interpreter.eval = function(env, expr) {
	if (expr instanceof (ast.Application)) {
	    closure = interpreter.eval(env, expr.func);
	    if (!(closure instanceof Closure)){
		alert("Error: Closure not an instance of closure");
	    }
	    cl = closure.getEnv();
	    argname = closure.argName();
	    body = closure.body();
	    return interpreter.eval(interpreter.substitute(cl, argname, expr.expr), body);
	}
	else if (expr instanceof ast.ConstantExpression) {
	    return expr.value;
	}
	else if (expr instanceof ast.VariableLookup) {
	    return interpreter.lookup(env, expr.identifier);
	}
	else if (expr instanceof Closure) {
	    return interpreter.eval(expr.getEnv(), expr.body());
	}
	alert("Error: Unknown expr");
	console.log("%o", expr);
    };
    
    interpreter.substitute = function(env, v, expr) {
	env[v] = expr;
	return env;
    };
    
    interpreter.lookup = function(env, identifier) {
	return env[identifier];
    };


    Closure = function(env, lambda) {
	this.env = env;
	this.lambda = lambda;
	this.getEnv = function() {
	    return this.env;
	};
	this.argName = function() {
	    return this.lambda.patterns[0].identifier;
	};
	this.body = function() {
	    return this.lambda.expr;
	};
    };

    interpreter.execute = function(ast) {
	env = {};
	// Only fun defs atm
	for (i in ast.declarations) {
	    expr = ast.declarations[i];
	    env[expr.identifier] = new Closure(env, new haskell.ast.Lambda(expr.patterns, expr.expression));
	};
	return interpreter.eval(env, env["main"]);
    }
})(haskell.interpreter, haskell.ast);