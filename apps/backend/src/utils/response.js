export function badRequest(message = "Invalid payload") {
    const error = new Error(message);
    error.status = 400;
    return error;
  }
  
  export function notFound(message = "Not found") {
    const error = new Error(message);
    error.status = 404;
    return error;
  }