{-#MagicHash#-}
module Prelude where

data Bool = True | False

infixl 6 +
infixl 6 -
infixl 7 *
infixr 0 $
infixr 9 .
infixr 2 ||
infixr 3 &&

($) f x = f x
(.) f g = \x -> f $ g x

(&&) False _ = False
(&&) True  y = y 

(||) x y = case x of
    True -> True
    False -> y

not x = case x of
    True -> False
    False -> True

otherwise = True

id x = x

map f xs = case xs of
    [] -> []
    (x:xs) -> f x : map f xs

(++) [] ys = ys
(++) (x:xs) ys = x : (xs ++ ys)

concat [] = []
concat (x:xs) = x ++ concat xs

foldr1 f xs = case xs of
    [x] -> x
    (x:xs) -> f x $ foldr1 f xs

filter f xs = case xs of
    [] -> []
    (x:xs) -> case f x of
        True -> x : filter f xs
        False -> filter f xs

iterate f x = f x : iterate f x

head xs = case xs of
    (x:_) -> x

tail xs = case xs of
    (_:xs) -> xs

fix f = let x = f x in x

fib n = case n of 
    0 -> 0
    1 -> 1
    _ -> fib (n-2) + fib (n-1)

data Int = I# Int#

(+) (I# i1) (I# i2) = I# (i1 +# i2)

(-) (I# i1) (I# i2) = I# (i1 -# i2)

(*) (I# i1) (I# i2) = I# (i1 *# i2)

stepDebug = stepDebug#

data Maybe a = Just a | Nothing

concatMap f xs = concat (map f xs)


-- List monad -_-
(>>) m a = m >>= (\_ -> a) 

(>>=) m f = concatMap f m

return a = [a]

fail _ = []

guard True = return undefined
guard False = mzero


mzero = []


undefined = undefined


catMaybes []           = []
catMaybes (Nothing:xs) = catMaybes xs
catMaybes ((Just a):xs)= a : catMaybes xs

alert = alert#

double m = do
       let doubleFunc = (*2)
       x <- m
       return (doubleFunc x)
