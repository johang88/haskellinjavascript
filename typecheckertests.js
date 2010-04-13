var ast = haskell.ast;
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

fireunit.compare(new ast.Num(1).infer({}), "Num", "");
fireunit.compare(new ast.VariableLookup("foo").infer({}, )
fireunit.testDone();