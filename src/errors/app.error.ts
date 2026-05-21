export abstract class AppError extends Error {
  readonly status: string;
  readonly isOperational: boolean;

  constructor(
    message: string, 
    readonly statusCode: number,
    readonly errors?: any[]       
  ) {
    super(message);
    
    this.name = this.constructor.name; 
    
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}