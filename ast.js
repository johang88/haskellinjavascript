// Exression
//    Value
//          (->)
//          Char
//          Num
//          Fractional
//          Algebraic data type
//    Function application
//          F v
//    If
//    Case
//        V
//        [(Pattern,Expression)]Just x = Just 5

/*

data Module
    = Module [Declaration]

data Expression 
    = ConstantExpression Value
    | Application Expression Expression
    | If Expression Expression Expression
    | Case Expression [(Pattern,Expression)]
    | Let Decleration Expression
    | Lambda [Pattern] Expression
    | VariableLookup Identifier

data Pattern
    = Constructor BigIdentifier [Pattern]
    | VariableBinding Identifier
    | Ignored
    | Combined Identifier Pattern
    | ConstantPattern Value
    // ! # ?

data Declaration 
    = VarDef Pattern Expression [Where]
    | FunDef Identifier [Pattern] Expression [Where] // ambigious with the above line when Pattern is an identifier and lenght [Pattern] == 0
    | FunDefGuard Identifier [Pattern] [(Guard, Expression)] [Where] 

Value 
    = Char
    | ConstantConstructor BigIdentifier
    | Num
    | Fraction

type Identifier = String
type BigIdentifier = String

type Guard = Expression
type Where = Expression

*/

(function(haskell) {

 var patternsToString = function(patterns) {
					return patterns.map(function(p) {
													return p.toString();
									}).join(" ");
	};

haskell.ast.Value = function() {

};

haskell.ast.Char = function(c) {
    this.c = c;

    this.toString = function() {
        return "'" + this.c + "'";
    };
};

haskell.ast.Num = function(num){
    this.num = num;
    this.toString = function() {
        return "" + this.num;
    };
};

haskell.ast.ConstantConstructor = function(identifier){
    this.identifier = identifier;
    this.toString = function() {
	return this.identifier;
    };
};

haskell.ast.Fraction = function(fraction) {
    this.fraction = fraction;
    this.toString = function() {
        return this.fraction;
    };
};


haskell.ast.Module = function(declarations) {
    this.declarations = declarations;
    this.toString = function() {
        return this.declarations.map(function(d) {return d.toString()}).join("\n");
    };
};

haskell.ast.Expression = function() {
    
};

haskell.ast.ConstantExpression = function(value) {
    this.value = value; // :: a
    this.toString = function() {
        return this.value.toString();
    };
};

haskell.ast.Application = function(func,expr) {
    this.func = func; // :: a -> b
    this.expr = expr; // :: a
    this.toString = function() {
        return "(" + this.func.toString() + " " +  this.expr.toString() + ")";
    };
};

haskell.ast.IfExpression = function(boolexpr,trueexpr,falseexpr) {
    this.boolexpr = boolexpr;   // :: Bool
    this.trueexpr = trueexpr;   // :: a
    this.falseexpr = falseexpr; // :: a
    this.toString = function() {
        return "if " + this.boolexpr.toString() + " then " + this.trueexpr.toString() + " else " + this.falseexpr.toString();
    };
};

haskell.ast.CaseExpression = function(testexpr,cases) {
    this.testexpr = testexpr; // :: a
    this.cases = cases; // :: [("Pattern" a, b)]
    this.toString = function() {
        return "case " + this.testexpr.toString() + "of\n" +
	this.cases.map(function(c) {return c[0].toString() + " -> " + c[1].toString()}).join("\n\t");
    };
};

haskell.ast.LetDeclaration = function(decleration,expression) {
    this.decleration = decleration; // no type
    this.expression = expression;   // :: a
    this.toString = function() {
        return "let " + this.decleration.toString() + " in " + this.expression.toString();
    };
};

haskell.ast.Lambda = function(patterns, expr){
    this.patterns = patterns;
    this.expr = expr;

    this.toString = function() {
        return "(\\ " + patternsToString(this.patterns) + " -> " + this.expr.toString() + " )"
    };
};

haskell.ast.VariableLookup = function(identifier) {
    this.identifier = identifier;

    this.toString = function() {
	return this.identifier;
    };
};

haskell.ast.Pattern = function() {

};

haskell.ast.PatternConstructor = function(constructor,patterns) {
    this.constructor = constructor;
    this.patterns = patterns;
    this.toString = function() {
        return "(" + this.constructor + " " + this.patterns.map(function(p) {return p.toString()}).join(" ") + ")";
    };    
};

haskell.ast.PatternVariableBinding = function(identifier) {
    this.identifier = identifier;
    this.toString = function() {
							 return this.identifier;
    }
};

haskell.ast.PatternIgnored = function() {
    this.toString = function() {
        return "_";
    };
};

haskell.ast.PatternCombined = function(identifier,pattern) {
    this.identifier = identifier;
    this.pattern = pattern;
    this.toString = function() {
        return this.identifier + "@" + this.pattern.toString();
    };
};

haskell.ast.PatternConstant = function(value) {
    this.value = value;
    this.toString = function() {
        return this.value.toString();
    };
};


haskell.ast.Declaration = function() {
    
};

haskell.ast.VarDef = function(pattern, expression, wheres) {
    this.pattern = pattern;
    this.expression = expression;
    this.wheres = wheres == null ? [] : wheres;
    this.toString = function() {
        return this.pattern.toString() + " = " + this.expression.toString() + "\n\twhere\n\t\t" + this.wheres.map(function(w){return w.toString()}).join("\n\t");
    };
};

haskell.ast.FunDef = function(identifier, patterns, expression, wheres) {
    this.identifier = identifier;
    this.patterns = patterns;
    this.expression = expression;
    this.wheres = wheres==null ? [] : wheres;
    this.toString = function() {
							 return this.identifier + " " + patternsToString(this.patterns) + " = " + this.expression.toString() +
								"\n\twhere\n\t\t" + this.wheres.map(function(w) {
																w.toString();
												}).join("\n\t\t");
				};
};


haskell.ast.FunDefGuard = function(identifier, patterns, guardExpressions, wheres) {
    this.identifier = identifier;
    this.patterns = patterns;
    this.expression = expression;
    this.wheres = wheres==null ? [] : wheres;
};

})(haskell);
