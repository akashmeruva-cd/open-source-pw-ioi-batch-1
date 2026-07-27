# JavaScript Functions

## What is a Function?

A function in JavaScript is a block of reusable code that performs a specific task. Instead of writing the same code multiple times, you can write it once inside a function and call it whenever needed.

## Syntax

```javascript
function functionName() {
    // Code to execute
}
```

## Example

```javascript
function greet() {
    console.log("Hello, Welcome to JavaScript!");
}

greet();
```

### Output

```
Hello, Welcome to JavaScript!
```

## Function with Parameters

Parameters allow us to pass values to a function.

```javascript
function add(a, b) {
    return a + b;
}

console.log(add(10, 20));
```

### Output

```
30
```

## Arrow Function

Arrow functions provide a shorter syntax for writing functions.

```javascript
const multiply = (a, b) => {
    return a * b;
};

console.log(multiply(5, 4));
```

### Output

```
20
```

## Advantages of Functions

- Reusable code
- Easy to maintain
- Reduces code duplication
- Improves readability
- Makes debugging easier

## Conclusion

Functions are one of the most important concepts in JavaScript. They help developers organize code, improve reusability, and make applications easier to understand and maintain.

