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
    | Lambda [Pattern] Expression

type Identifier = String
type BigIdentifier = String

type Guard = Expression
type Where = Expression

*/

haskell.ast.Value = function() {

};

haskell.ast.Char = function(c) {
    this.c = c;
};

haskell.ast.Num = function(num){

    this.num = num;
};

haskell.ast.ConstantConstructor = function(identifier){
    this.identifier = identifier;
};

haskell.ast.Fraction = function(fraction) {
    this.fraction = fraction;
};

haskell.ast.Lambda = function(patterns, expr){
    this.patterns = patterns;
    this.expr = expr;
};

haskell.ast.Char.prototype                = haskell.ast.Value;
haskell.ast.Num.prototype                 = haskell.ast.Value;
haskell.ast.ConstantConstructor.prototype = haskell.ast.Value;
haskell.ast.Fraction.prototype            = haskell.ast.Value;
haskell.ast.Lambda.prototype              = haskell.ast.Value;


haskell.ast.Module = function(declarations) {
    this.declarations = declarations;
};

haskell.ast.Expression = function() {
    
};

haskell.ast.ConstantExpression = function(value) {
    this.value = value; // :: a
};

haskell.ast.Application = function(func,expr) {
    this.func = func; // :: a -> b
    this.expr = expr; // :: a
};

haskell.ast.IfExpression = function(boolexpr,trueexpr,falseexpr) {
    this.boolexpr = boolexpr;   // :: Bool
    this.trueexpr = trueexpr;   // :: a
    this.falseexpr = falseexpr; // :: a
};

haskell.ast.CaseExpression = function(testexpr,cases) {
    this.testexpr = testexpr; // :: a
    this.cases = cases; // :: [("Pattern" a, b)]
};

haskell.ast.LetDeclaration = function(decleration,expression) {
    this.decleration = decleration; // no type
    this.expression = expression;   // :: a
};

haskell.ast.ConstantExpression.prototype = haskell.ast.Expression;
haskell.ast.LetDeclaration.prototype = haskell.ast.Expression;
haskell.ast.Application.prototype = haskell.ast.Expression;
haskell.ast.IfExpression.prototype = haskell.ast.Expression;
haskell.ast.CaseExpression.prototype = haskell.ast.Expression;

haskell.ast.Pattern = function() {

};

haskell.ast.PatternConstructor = function(constructor,patterns) {
    this.constructor = constructor;
    this.patterns = patterns;
};

haskell.ast.PatternVariableBinding = function(identifier) {
    this.identifier = identifier;
};

haskell.ast.PatternIgnored = function() {
    
};

haskell.ast.PatternCombined = function(identifier,pattern) {
    this.identifier = identifier;
    this.pattern = pattern;
};

haskell.ast.PatternConstant = function(value) {
    this.value = value;
};

haskell.ast.PatternConstructor.prototype = haskell.ast.Pattern;
haskell.ast.PatternVariableBinding.prototype = haskell.ast.Pattern;
haskell.ast.PatternIgnored.prototype = haskell.ast.Pattern;
haskell.ast.PatternCombined.prototype = haskell.ast.Pattern;
haskell.ast.PatternConstant.prototype = haskell.ast.Pattern;

haskell.ast.Declaration = function() {
    
};

haskell.ast.VarDef = function(pattern, expression, wheres) {
    if (wheres==null)
    {
        wheres=[];
    }
    this.pattern = pattern;
    this.expression = expression;
    this.wheres = wheres;
};

haskell.ast.FunDef = function(identifier, patterns, expression, wheres) {
    this.identifier = identifier;
    this.patterns = patterns;
    this.expression = expression;
    this.wheres = wheres==null ? [] : wheres;
};


haskell.ast.FundDefGuard = function(identifier, patterns, guardExpressions, wheres) {
    this.identifier = identifier;
    this.patterns = patterns;
    this.expression = expression;
    this.wheres = wheres==null ? [] : wheres;
};

haskell.ast.VarDef.prototype = hashell.ast.Declaration;
haskell.ast.FunDef.prototype = hashell.ast.Declaration;
haskell.ast.FunGuardDef.prototype = hashell.ast.Declaration;