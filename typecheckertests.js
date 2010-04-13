var ast = haskell.ast;
var typechecker = haskell.typechecker;

var astt = new ast.Module(
    [
	new ast.Variable(
	    new ast.VariableBinding("inc"),
	    new ast.Lambda(
		new ast.VariableBinding("x"),
		new ast.Application(
		    new ast.Application(
			new ast.VariableLookup("+"),
			new ast.VariableLookup("x")),
		    new ast.Constant(new ast.Num(1))))),
	new ast.Variable(
	    new ast.VariableBinding("inc2"),
	    new ast.Lambda(
		new ast.VariableBinding("x"),
		new ast.Application(
		    new ast.VariableLookup("inc"),
		    new ast.Application(
			new ast.VariableLookup("inc"),
			new ast.VariableLookup("x"))))),
	new ast.Variable(
	    new ast.VariableBinding("main"),
	    new ast.Application(
		new ast.VariableLookup("alert"),
		new ast.Application(
		    new ast.VariableLookup("inc2"),
		    new ast.Constant(new ast.Num(2)))))
    ]);

var asttt = new ast.Application(
    new ast.Application(
	new ast.VariableLookup("+"),
	new ast.VariableLookup("x")),
    new ast.Constant(new ast.Num(1))); // ((x + :: (Num -> Num)) 1 :: Num)

fireunit.compare(
    new typechecker.Star().toString(),
    "*",
    "Star is *");

fireunit.compare(
    new typechecker.Kfun(new typechecker.Star(), new typechecker.Star()).toString(),
    "*->*",
    "Kfun Star Star is *->*");

fireunit.compare(
    new typechecker.Kfun(
	new typechecker.Kfun(new typechecker.Star(), new typechecker.Star()),
	new typechecker.Star()).toString(),
    "*->*->*",
    "Kfun Kfun Star Star Star is *->*->*");

fireunit.compare(
    new typechecker.Kfun(
	new typechecker.Star(),
	new typechecker.Kfun(new typechecker.Star(), new typechecker.Star())).toString(),
    "*->*->*",
    "Kfun Star Kfun Star Star is *->*->*");

fireunit.compare(
    new ast.Num(1).infer({}).toString(),
    "Num a1 => a1 (*)",
    "1 is Num a1 => a1 (*)"
);

fireunit.compare(
    new ast.Num(1).infer({}).class(),
    "Num",
    "1 is in Num");
fireunit.compare(
    new ast.Num(1).infer({}).type().id(),
    "a1",
    "1 is a typvariable named a1");

fireunit.testDone();