// this is how we will standardise the error handling 

class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went grong",
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;


        // this is a stack trace to know exactly where actually is the problem
        if(stack){
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}


export {ApiError}