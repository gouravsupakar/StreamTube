const asyncHandler = (func) => {
   return (req, res, next) => {
        Promise.resolve(
            func(req, res, next)
        ).catch((err) => next(err))
    }
}   // this async handler handles promises with .then and .catch it takes a function and executes it




export {asyncHandler}



//this is a higher order function that take a function as a parameter and execute that function and  returns the result
// const asynchandler = () => {}
// const asynchandler = (func) => {() => {}};  just removing the outer curlybrackets
// const asynchandler = (func) => async() => {}    


// this is just a wrapper function

// const asyncHandler = (func) => async(req, res, next) => {
//     try {
//         await func(req, res, next);   // just taking the function and executing it
//     } catch (error) {
//         res.status(error.code || 400).json({
//             success: false,
//             message: error.message
//         })
//     }
// }




/*  Explation of the asynchandler

Your code snippets illustrate different ways to handle asynchronous operations in an Express application using higher-order functions. The asyncHandler function wraps asynchronous route handlers to catch errors and pass them to the next middleware, ensuring a more robust error-handling mechanism.

Let's break down the provided examples and refine the implementation.

1. Using .then() and .catch()
This approach uses promise chaining to handle errors:

javascript
Copy code
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };
2. Using async/await for Cleaner Syntax
Using async/await simplifies the syntax and improves readability:

javascript
Copy code
const asyncHandler = (func) => {
  return async (req, res, next) => {
    try {
      await func(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export { asyncHandler };
Explanation
Higher-Order Function
A higher-order function is a function that takes another function as an argument and/or returns a function. In this case, asyncHandler is a higher-order function because it takes a request handler func and returns a new function that wraps the original handler with error-handling logic.

Promises and async/await
Both implementations achieve the same goal: ensuring that any unhandled promise rejections in the asynchronous route handler are caught and passed to the next middleware function for error handling.

Usage Example
Here's an example of how you would use asyncHandler in an Express route:

javascript
Copy code
import express from 'express';
import { asyncHandler } from './path/to/asyncHandler';

const app = express();

const getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  res.json(user);
};

app.get('/user/:id', asyncHandler(getUser));

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
Benefits
Code Readability: The asyncHandler function wraps your asynchronous route handlers, making your routes cleaner and more readable.
Error Handling: It ensures that any errors thrown within your asynchronous route handlers are properly caught and passed to the Express error handling middleware.
Reusability: You can reuse the asyncHandler function across different route handlers, following the DRY (Don't Repeat Yourself) principle.
By using the asyncHandler function, you can effectively manage errors in your asynchronous Express route handlers, leading to more maintainable and robust applications.

*/