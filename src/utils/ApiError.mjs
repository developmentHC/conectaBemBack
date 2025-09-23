class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;

    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createApiError = (message, statusCode) => {
  return new ApiError(message, statusCode);
};

export default ApiError;

//comentario