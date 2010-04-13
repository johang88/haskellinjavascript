module Prelude where {
    data Bool = True | False;

    infixl 6 +;
    infixl 6 -;
    infixl 7 *;
    infixr 0 $;
    infixr 9 .;
    infixr 2 ||;
    infixr 3 &&;

    ($) f x = f x;
    (.) f g = \x -> f $ g x;
    
    (&&) x y = case x of {
        False -> False;
        True -> y;
    };
    
    (||) x y = case x of {
        True -> True;
        False -> y;
    };
    
    not x = case x of {
        True -> False;
        False -> True;
    };
    
    otherwise = True;
    
    id x = x;

    map f xs = case xs of {
    	  [] -> [];
	  (x:xs) -> f x : map f xs;
    	};
        
    foldr1 f xs = case xs of {
        [x] -> x;
        (x:xs) -> f x (foldr1 f xs);
    };
    
    filter f xs = case xs of {
        [] -> [];
        (x:xs) -> case (f x) of {
            True -> x : filter f xs;
            False -> filter f xs;
        };
    };
    
    iterate f x = f x : iterate f (f x);
    
    head xs = case xs of { (x:_) -> x; };
    
    tail xs = case xs of { (_:xs) -> xs; };
    
    fix f = let { x = f x; } in x;
}
