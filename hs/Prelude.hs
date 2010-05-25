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

foldr _ b [] = b
foldr f b (x:xs) = foldr f (f x b) xs

foldl _ b [] = b
foldl f b (x:xs) = foldl f (f b x) xs

reverse = foldl (\a b -> b:a) []

flip f a b = f b a

filter _ [] = []
filter f (x:xs ) | f x = x : filter f xs
                 | otherwise = filter f xs
                 
iterate f x = f x : iterate f (f x)

zipWith f (a:as) (b:bs) = f a b : zipWith f as bs
zipWith _ _ _ = []

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

(==) (I# i1) (I# i2) = i1 ==# i2

(>) (I# i1) (I# i2) = i1 ># i2

(<) (I# i1) (I# i2) = i1 <# i2

(<=) (I# i1) (I# i2) = i1 <=# i2

(>=) (I# i1) (I# i2) = i1 >=# i2

(%) (I# i1) (I# i2) = I# (remInt# i1 i2)

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


take 0 _      = []
take n (x:xs) = x : take (n-1) xs
take _ []     = []

length [] = 0
length (_:xs) = 1 + length xs


const r _ = r

-- Enum functions only for int so far, awaiting type classes
enumHelper i p n = case p n of 
                     True -> []
                     False -> n : enumHelper i p (n+i)

enumFrom e1 = enumHelper 1 (const False) e1

enumFromThen e1 e2 = enumHelper (e2-e1) (const False) e1

enumFromTo e1 e3 = enumHelper 1 (>e3) e1

enumFromThenTo e1 e2 e3 = enumHelper (e2-e1) (>e3) e1
