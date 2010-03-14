module Prelude where {
    ($) f x = f x;
    (.) f g = \x -> f $ g x;
    
    map f [] = [];
    map f (x:xs) = f x : map f xs;
    
    id x = x;
    
    fix f = let x = f x in x
}
