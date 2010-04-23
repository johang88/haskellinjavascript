(function(interpreter, ast, primitives, utilities){
    // Creates env from an ast and returns it !
    interpreter.prepare = function(astt, env) {
        for (var i in astt.declarations) {
            var decl = astt.declarations[i];
	    if (decl.type=="Variable") {
		env.patternBind(decl.pattern, new interpreter.HeapPtr(new interpreter.Closure(env, decl.expression)));
	    }
	    else if (decl.type=="Data") {
                console.log("%s", decl);
		for (var i in decl.constructors) {
		    constr = decl.constructors[i];
		    env.bind(constr.identifier, primitives.createDataConstructorKludge(env, constr.identifier, constr.number));
		};
	    };
        };
        return env;
    };

    // Executes a haskell program
    interpreter.execute = function(astt) {
	var env = new interpreter.RootEnv();
	// Only fun defs atm
	interpreter.prepare(astt, env);
	primitives.init(env);
	return env.lookup("main").dereference();
    };

    // Evaluates an expression under an env
    interpreter.eval = function(astt, env) {
	return (new interpreter.HeapPtr(new interpreter.Closure(env, astt))).dereference();
    }; 

     // Live data
    /*
     data Env = RootEnv [(Identifier, Pattern, HeapPtr)|(Identifier, HeapPtr)]
              | ChildEnv [(Identifier, Pattern, HeapPtr)|(Identifier, HeapPtr)] Env
    */
    interpreter.Env = function() {
        
    };

    interpreter.Env.prototype.substitute = function(pattern, expression) {
	var newEnv = this.derive();
	newEnv.patternBind(pattern, expression);
	return newEnv;
    };
    interpreter.Env.prototype.derive = function() {
	return new interpreter.ChildEnv(this);
    };
    interpreter.Env.prototype.patternBind = function(pattern, expression) {
	var vars = pattern.vars();
	for (var i in vars) {
	    this.env[vars[i]] = [pattern, expression];
	    this.env[vars[i]].type = "unforced";
	}
    };
    interpreter.Env.prototype.bind = function(identifier, expr) {
        utilities.expectType(expr, interpreter.HeapPtr);
	this.env[identifier] = expr;
    };
    interpreter.Env.prototype.lookup = function(identifier) {
	if (this.env[identifier]==undefined) {
	    return this.onUndefined(identifier);
	};
	var found = this.env[identifier];
	if (found.type == "unforced") {
	    if (!found[0].match(this, found[1])) {
		throw new Error("Unrefutable pattern failed");
	    };
	};
	return this.env[identifier];
    };
    interpreter.Env.prototype.onUndefined = function(identifier) {
	return undefined;
    };

  
    interpreter.RootEnv = function() {
	this.env = {};
	this.type = "RootEnv";
    };
    interpreter.RootEnv.prototype = new interpreter.Env();
    interpreter.RootEnv.prototype.constructor = interpreter.RootEnv;

    interpreter.ChildEnv = function(parent) {
	this.env = {};
	this.type = "ChildEnv";
	this.parent = parent;
    };
    interpreter.ChildEnv.prototype = new interpreter.Env();
    interpreter.ChildEnv.prototype.constructor = interpreter.ChildEnv;

    interpreter.ChildEnv.prototype.onUndefined = function(identifier) {
	return this.parent.lookup(identifier);
    };

    /* data HeapPtr = HeapPtr Thunk WeakHead */
    // There's no actuall heap pointer here
    // The name is just used to highlight that it's
    // use is the same as the heap pointer in a
    // standard haskell implementation.
    // "dereferencing" a HeapPtr returns the forced
    // version of the thunk it points to as well
    // as updates the pointer to the whnf.
    interpreter.HeapPtr = function(thunk) {
        this.thunk = thunk;
        this.weakHead = undefined;
        // Dereferencing a HeapPtr returns a whnf
        this.dereference = function() {
            if (this.weakHead == undefined) {
                // We'll drive the execution here instead of recursing in the force method
                var continuation = this.thunk.force();
                while (continuation instanceof interpreter.Thunk) {
                    continuation = continuation.force();
                }
                this.weakHead = continuation;
                this.thunk = null;
            }
            return this.weakHead;
        };

        this.stringify = function() {
            if (this.weakHead == undefined) {
                return this.thunk.stringify();
            }
            if (this.weakHead.stringify == undefined) {
                return this.weakHead;
            }
            return this.weakHead.stringify();
        };
    };


    /*
     data Thunk = Closure Env Expression
                | ConstantThunk Value
	        | Data Identifier [HeapPtr]
	        | Primitive Env Function
		| PrimData -- Javascript data
    */
    interpreter.Thunk = function() {};
    interpreter.Closure = function(env, expression) {
        utilities.expectType(env, interpreter.Env);
        utilities.expectType(expression, ast.Expression);
	this.type = "Closure";
	this.env = env;
	this.expression = expression;
        // force returns the whnf
        this.force = function() {
	    // Forcing a closure is the same as evaluating its expression under the closures env
	    return this.expression.eval(this.env);
        };

        this.stringify = function() {
            return this.expression.stringify();
        };
    };

    interpreter.ConstantThunk = function(value) {
	this.type = "ConstantThunk";
	this.value = value;
        this.force = function() {
	    return this;
        };
    };

    interpreter.Closure.prototype = new interpreter.Thunk();
    interpreter.ConstantThunk.prototype = new interpreter.Thunk();

    /* 
       data WeakHead = Data Identifier [HeapPtr]
                     | LambdaAbstraction Env Pattern Expression
                     | Primitive
    */
    interpreter.Data = function(identifier, ptrs) {
        utilities.expectTypeArray(ptrs, interpreter.HeapPtr);
	this.type = "Data";
	this.identifier = identifier;
	this.ptrs = ptrs;
        this.getPtrs = function() {
            return this.ptrs;
        };

        this.stringify = function() {
            return "(" + this.identifier + " " + this.ptrs.map(function(ptr) {
                return ptr.stringify();
            }).join(" ") + ")";
        };
    };
    interpreter.LambdaAbstraction = function(env, pattern, expression)
    {
        this.type="LambdaAbstraction";
        this.env = env;
        this.pattern = pattern;
        this.expression = expression;
        this.apply = function(argument) {
            var substitution = this.env.substitute(this.pattern, argument);
            return this.expression.eval(substitution);
        };

        this.stringify = function() {
            return "(\\" + this.pattern.stringify() + " -> " + this.expression.stringify() + ")"
        };
    };
})(haskell.interpreter, haskell.ast, haskell.primitives, haskell.utilities);
