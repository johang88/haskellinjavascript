(function(primitives, ast, interpreter){
    primitives.prim = function(env) {
	// data Char#

	// gtChar# :: Char# -> Char# -> Bool
	env.bind("gtChar#", ["a", "b"], gtPrim);

	// geChar# :: Char# -> Char# -> Bool
	env.bind("geChar#", ["a", "b"], gePrim);

	// eqChar# :: Char# -> Char# -> Bool
	env.bind("eqChar#", ["a", "b"], eqPrim);

	// neChar# :: Char# -> Char# -> Bool
	env.bind("neChar#", ["a", "b"], nePrim);

	// ltChar# :: Char# -> Char# -> Bool
	env.bind("ltChar#", ["a", "b"], ltPrim);

	// leChar# :: Char# -> Char# -> Bool
	env.bind("leChar#", ["a", "b"], lePrim);

	// ord# :: Char# -> Int#
	env.bind("ord#", ["a"], 
		 function(env) {
		     var a = env.lookup("a");
		     return a.charCodeAt(0);
		 });

	// data Int#
	var intSize = 32;
	// (+#) :: Int# -> Int# -> Int#
	env.bind("+#", ["a", "b"], primAdd(intSize, true));
	// (-#) :: Int# -> Int# -> Int#
   	env.bind("-#", ["a", "b"], primSub(intSize, true));
	// (*#) :: Int# -> Int# -> Int#
	env.bind("*#", ["a", "b"], primMul(intSize, true));
	// mulIntMayOflo# :: Int# -> Int# -> Int#
	// quotInt# :: Int# -> Int# -> Int#
	env.bind("quotInt#", ["a", "b"], primQuot(intSize, true));
	// remInt# :: Int# -> Int# -> Int#
	env.bind("remInt#", ["a", "b"], primRem(intSize, true));
	// negateInt# :: Int# -> Int#
	env.bind("negateInt#", ["a", "b"], primNegate(intSize, true));
	// addIntC# :: Int# -> Int# -> (#Int#, Int##)
	// subIntC# :: Int# -> Int# -> (#Int#, Int##)
	// (>#) :: Int# -> Int# -> Bool
	env.bind(">#", ["a", "b"], gtPrim);
	// (>=#) :: Int# -> Int# -> Bool
	env.bind(">=#", ["a", "b"], gePrim);
	// (==#) :: Int# -> Int# -> Bool
	env.bind("==#", ["a", "b"], eqPrim);
	// (/=#) :: Int# -> Int# -> Bool
	env.bind("/=#", ["a", "b"], nePrim);
	// (<#) :: Int# -> Int# -> Bool
	env.bind("<#", ["a", "b"], ltPrim);
	// (<=#) :: Int# -> Int# -> Bool
	env.bind("<=#", ["a", "b"], lePrim);
	// chr# :: Int# -> Char#
	// int2Word# :: Int# -> Word#
	env.bind("int2Word#", ["a"], primNarrow(32, true));
	// int2Float# :: Int# -> Float#
	env.bind("int2Float#", ["a"], primNarrow(32, true));
	// int2Double# :: Int# -> Double#
	env.bind("int2Double#", ["a"], primNarrow(64, true));
	// uncheckedIShiftL# :: Int# -> Int# -> Int#
	env.bind("uncheckedIShiftL#", ["a", "b"], uncheckedIShiftL);
	// uncheckedIShiftRA# :: Int# -> Int# -> Int#
	env.bind("uncheckedIShiftRA#", ["a", "b"], uncheckedIShiftRA);
	// uncheckedIShiftRL# :: Int# -> Int# -> Int#
	env.bind("uncheckedIShiftRL#", ["a", "b"], uncheckedIShiftRL);


	// Some extras:
	// intToString# :: Int# -> String#
	env.bind("intToString#", ["a"], function(env) {
		return "" + env.lookup("a");
	    });
	// alert# -> String# -> () -- This should be IO ()
	env.bind("alert#", ["a"], function(env) {
		// TODO: Are we sure that primitives are evaluated?
		alert(env.lookup("a"));
		return new interpreter.Data("()", []);
	    });
    };

    primitives.init = function(env) {
	primitives.prim(env);
	// seq :: a -> b -> b
	env.bind("seq", createPrimitive(env, ["a", "b"],
					function(env) {
					    env.lookup("a").forceHead();
					    return env.lookup("b");
					}));

	// Can print all different haskell types (including functions...)
	// Should be hidden away and only used for the deriving Show implementation.
	// defaultShow :: a -> String#
	env.bind("defaultShow", createPrimitive(env, ["s"],
						function(env) {
						    var t = env.lookup("s");
						}));

	env.bind(":", createDataConstructor(env, ":", 2));
	env.bind("[]", createDataConstructor(env, "[]", 0));
    };
    
    function createPrimitive(env, args, func) {
	var expr = new ast.Primitive(func);
	var argsR = [].concat(args).reverse();
	for (var i in argsR) {
	    expr = new ast.Lambda(new ast.VariableBinding(argsR[i]), expr);
	};
	return new interpreter.Closure(env, expr);
    };


    function createDataConstructor(env, ident, num) {
	var args = [];
	for (var i = 0; i<num; i++) {
	    args[i] = "__p" + i;
	};
	var prim = function(env) {
	    var givenArgs=[];
	    for (var i in args) {
		givenArgs[i] = env.lookup(args[i]);
	    };
	    return new interpreter.Data(ident, givenArgs);
	};
	return createPrimitive(env, args, prim);
    };

    primitives.createDataConstructorKludge = createDataConstructor;


    function forceHead(thunk) {
	while(thunk.type!="ConstantThunk" && thunk.type!="Data") {
	    thunk=thunk.force();
	};
	return thunk;
    };


    function boxBool(env, b) {
	if (b) {
	    return env.lookup("True");
	};
	return env.lookup("False");
    };

    function gtPrim(env) {
	var a = env.lookup("a");
	var b = env.lookup("b");
	return boxBool(env, a > b);
    };

    function gePrim(env) {
	var a = env.lookup("a");
	var b = env.lookup("b");
	return boxBool(env, a >= b);
    };

    function eqPrim(env) {
	var a = env.lookup("a");
	var b = env.lookup("b");
	return boxBool(env, a == b);
    };

    function nePrim(env) {
	var a = env.lookup("a");
	var b = env.lookup("b");
	return boxBool(env, a != b);
    };

    function ltPrim(env) {
	var a = env.lookup("a");
	var b = env.lookup("b");
	return boxBool(env, a < b);
    };

    function lePrim(env) {
	var a = env.lookup("a");
	var b = env.lookup("b");
	return boxBool(env, a <= b);
    };

    function primAdd(bits, twoComplement) {
	return function(env) {
	    var a = env.lookup("a");
	    var b = env.lookup("b");
	    var result = a + b;
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primSub(bits, twoComplement) {
	return function(env) {
	    var a = env.lookup("a");
	    var b = env.lookup("b");
	    var result = a - b;
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primMul(bits, twoComplement) {
	return function(env) {
	    var a = env.lookup("a");
	    var b = env.lookup("b");
	    var result = a * b;
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primQuot(bits, twoComplement) {
	return function(env) {
	    var a = env.lookup("a");
	    var b = env.lookup("b");
	    var result = parseInt(a / b);
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primRem(bits, twoComplement) {
	return function(env) {
	    var a = env.lookup("a");
	    var b = env.lookup("b");
	    var result = a % b;
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primNegate(bits, twoComplement) {
	return function(env) {
	    var a = env.lookup("a");
	    var result = -a;
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primNarrow(bits, twoComplement) {
	return function(env) {
	    return doPrimNarrow(bits, twoComplement, env.lookup("a"));
	};
    };

    // Narrows a number by chopping of the higher bits
    function doPrimNarrow(bits, twoComplement, num) {
	num = num & (Math.pow(2, bits+1) - 1);
	if (twoComplement && (num & Math.pow(2, bits))) {
	    return num - Math.pow(2, bits);
	};
	return num;
    };

    // Narrows a number by overflowing it
    function doPrimOverflow(bits, twoComplement, num) {
	return doPrimNarrow(bits, twoComplement, num);
    };

    function uncheckedIShiftL(env) {
	return env.lookup("a") << env.lookup("b");
    };

    function uncheckedIShiftRA(env) {
	return env.lookup("a") >> env.lookup("b");
    };

    function uncheckedIShiftRL(env) {
	return env.lookup("a") >>> env.lookup("b");
    };
})(haskell.primitives, haskell.ast, haskell.interpreter);