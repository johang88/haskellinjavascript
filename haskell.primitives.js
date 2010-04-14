(function(primitives, ast, interpreter){
    primitives.prim = function(env) {
	// data Char#

	// gtChar# :: Char# -> Char# -> Bool
	env.bind("gtChar#", createPrimitive(env, 2, gtPrim));

	// geChar# :: Char# -> Char# -> Bool
	env.bind("geChar#", createPrimitive(env, 2, gePrim));

	// eqChar# :: Char# -> Char# -> Bool
	env.bind("eqChar#", createPrimitive(env, 2, eqPrim));

	// neChar# :: Char# -> Char# -> Bool
	env.bind("neChar#", createPrimitive(env, 2, nePrim));

	// ltChar# :: Char# -> Char# -> Bool
	env.bind("ltChar#", createPrimitive(env, 2, ltPrim));

	// leChar# :: Char# -> Char# -> Bool
	env.bind("leChar#", createPrimitive(env, 2, lePrim));

	// ord# :: Char# -> Int#
	env.bind("ord#", createPrimitive(env, 1, 
					 function(env, args) {
					     return args[0].charCodeAt(0);
					 }));

	// data Int#
	var intSize = 32;
	// (+#) :: Int# -> Int# -> Int#
	env.bind("+#", createPrimitive(env, 2, primAdd(intSize, true)));
	// (-#) :: Int# -> Int# -> Int#
   	env.bind("-#", createPrimitive(env, 2, primSub(intSize, true)));
	// (*#) :: Int# -> Int# -> Int#
	env.bind("*#", createPrimitive(env, 2, primMul(intSize, true)));
	// mulIntMayOflo# :: Int# -> Int# -> Int#
	// quotInt# :: Int# -> Int# -> Int#
	env.bind("quotInt#", createPrimitive(env, 2, primQuot(intSize, true)));
	// remInt# :: Int# -> Int# -> Int#
	env.bind("remInt#", createPrimitive(env, 2, primRem(intSize, true)));
	// negateInt# :: Int# -> Int#
	env.bind("negateInt#", createPrimitive(env, 2, primNegate(intSize, true)));
	// addIntC# :: Int# -> Int# -> (#Int#, Int##)
	// subIntC# :: Int# -> Int# -> (#Int#, Int##)
	// (>#) :: Int# -> Int# -> Bool
	env.bind(">#", createPrimitive(env, 2, gtPrim));
	// (>=#) :: Int# -> Int# -> Bool
	env.bind(">=#", createPrimitive(env, 2, gePrim));
	// (==#) :: Int# -> Int# -> Bool
	env.bind("==#", createPrimitive(env, 2, eqPrim));
	// (/=#) :: Int# -> Int# -> Bool
	env.bind("/=#", createPrimitive(env, 2, nePrim));
	// (<#) :: Int# -> Int# -> Bool
	env.bind("<#", createPrimitive(env, 2, ltPrim));
	// (<=#) :: Int# -> Int# -> Bool
	env.bind("<=#", createPrimitive(env, 2, lePrim));
	// chr# :: Int# -> Char#
	// int2Word# :: Int# -> Word#
	env.bind("int2Word#", createPrimitive(env, 1, primNarrow(32, true)));
	// int2Float# :: Int# -> Float#
	env.bind("int2Float#", createPrimitive(env, 1, primNarrow(32, true)));
	// int2Double# :: Int# -> Double#
	env.bind("int2Double#", createPrimitive(env, 1, primNarrow(64, true)));
	// uncheckedIShiftL# :: Int# -> Int# -> Int#
	env.bind("uncheckedIShiftL#", createPrimitive(env, 2, uncheckedIShiftL));
	// uncheckedIShiftRA# :: Int# -> Int# -> Int#
	env.bind("uncheckedIShiftRA#", createPrimitive(env, 2, uncheckedIShiftRA));
	// uncheckedIShiftRL# :: Int# -> Int# -> Int#
	env.bind("uncheckedIShiftRL#", createPrimitive(env, 2, uncheckedIShiftRL));


	// Some extras:
	// intToString# :: Int# -> String#
	env.bind("intToString#", createPrimitive(env, 1, function(env, args) {
		    return "" + args[0];
		}));
	// alert# -> String# -> () -- This should be IO ()
	env.bind("alert#", createPrimitive(env, 1, function(env) {
		    // TODO: Are we sure that primitives are evaluated?
		    alert(args[0]);
		    return new interpreter.Data("()", []);
		}));
	// debug# :: a -> () -- This should be IO (), outputs an unforced expression. "as is"
	env.bind("debug#", createPrimitive(env, 1, function(env, args) {
		    console.log("debug#: %o", args[0]);
		    return new interpreter.Data("()", []);
		}));
    };

    primitives.init = function(env) {
	primitives.prim(env);
	// seq :: a -> b -> b
	env.bind("seq", createPrimitive(env, 2,
					function(env, args) {
					    args[0].force();
					    return args[1];
					}));

	// Can print all different haskell types (including functions...)
	// Should be hidden away and only used for the deriving Show implementation.
	// defaultShow :: a -> String#
	env.bind("defaultShow", createPrimitive(env, 1,
						function(env) {
						    alert("undefined");
						}));

	env.bind(":", createDataConstructor(env, ":", 2));
	env.bind("[]", createDataConstructor(env, "[]", 0));
    };
    
    function createPrimitive(env, numArgs, func) {
	if (numArgs.length != undefined) {
	    numArgs = numArgs.length; // KLUDGE: createPrimitive should take a number instead of an argument list
	}
	var args = [];
	for (var i = 0; i<numArgs; i++) {
	    args[i] = "__p" + i;
	}; 
	var primitive = function(env) {
	    var givenArgs=[];
	    for (var i in args) {
		givenArgs[i] = env.lookup(args[i]);
	    };
	    return func(env, givenArgs);
	};
	var expr = new ast.Primitive(primitive);
	var argsR = [].concat(args).reverse();
	for (var i in argsR) {
	    expr = new ast.Lambda(new ast.VariableBinding(argsR[i]), expr);
	};
	return new interpreter.Closure(env, expr);
    };


    function createDataConstructor(env, ident, num) {
	var prim = function(env, args) {
	    return new interpreter.Data(ident, args);
	};
	return createPrimitive(env, num, prim);
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

    function gtPrim(env, args) {
	return boxBool(env, args[0] > args[1]);
    };

    function gePrim(env, args) {
	return boxBool(env, args[0] >= args[1]);
    };

    function eqPrim(env, args) {
	return boxBool(env, args[0] == args[1]);
    };

    function nePrim(env, args) {
	return boxBool(env, args[0] != args[1]);
    };

    function ltPrim(env, args) {
	return boxBool(env, args[0] < args[1]);
    };

    function lePrim(env, args) {
	return boxBool(env, args[0] <= args[1]);
    };

    function primAdd(bits, twoComplement) {
	return function(env, args) {
	    var result = args[0] + args[1];
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primSub(bits, twoComplement) {
	return function(env, args) {
	    var result = args[0] - args[1];
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primMul(bits, twoComplement) {
	return function(env, args) {
	    var result = args[0] * args[1];
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primQuot(bits, twoComplement) {
	return function(env, args) {
	    var result = parseInt(args[0] / args[1]);
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primRem(bits, twoComplement) {
	return function(env, args) {
	    var result = args[0] % args[1];
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primNegate(bits, twoComplement) {
	return function(env, args) {
	    var result = -args[0];
	    return doPrimOverflow(bits, twoComplement, result);
	};
    };

    function primNarrow(bits, twoComplement) {
	return function(env, args) {
	    return doPrimNarrow(bits, twoComplement, args[0]);
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

    function uncheckedIShiftL(env, args) {
	return args[0] << args[1];
    };

    function uncheckedIShiftRA(env) {
	return args[0] >> args[1];
    };

    function uncheckedIShiftRL(env) {
	return args[0] >>> args[1];
    };
})(haskell.primitives, haskell.ast, haskell.interpreter);