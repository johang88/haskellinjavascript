module Prelude where {
    infixl 6 +;
    infixl 6 -;
    infixl 7 *;
    infixr 0 $;
    infixr 9 .;

    ($) f x = f x;
    (.) f g = \x -> f $ g x;
    
    map f [] = [];
    map f (x:xs) = f x : map f xs;
    
    id x = x;
    
    fix f = let x = f x in x
}
