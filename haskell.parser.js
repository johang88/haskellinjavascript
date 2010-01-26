// The parser
/**
 * Parses Haskell code
 * \code Code to parse
 * \return The ast
 */
 
haskell.parser.parse = function(code) {
	var expr = function(state) { return expr(state); };
	
	var value = choice(repeat1(range('0', '9')), expr);
	var product = sequence(value, repeat0(sequence(choice('*', '/'), value)));
	var sum = sequence(value, repeat0(sequence(choice('+', '-'), value)));
	var expr = sum;

	return expr(ps(code));
};