import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import axios from 'axios';

export const keycloakErrorMessages: Record<
  string,
  (params: string[]) => string
> = {
  'error-invalid-value': (params: string[]) =>
    `The value of the field ${params[0]} is invalid.`,
};

interface KeycloakErrorResponse {
  errorMessage?: string;
  params?: string[];
}

export function handleError(
  logger: Logger,
  message: string = 'Validation errors',
  httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  error: unknown,
) {
  let errorMessage: {
    statusCode: HttpStatus;
    message: string;
    errors?: any;
  };

  if (error) {
    if (
      error instanceof BadRequestException ||
      error instanceof HttpException
    ) {
      const validationErrors = error.getResponse();

      errorMessage = {
        statusCode: httpStatus,
        message,
        errors: validationErrors,
      };

      logger.error(errorMessage, error.stack);
      throw new HttpException(errorMessage, httpStatus);
    }

    if (axios.isAxiosError(error) && error.response) {
      const keycloakError = error.response.data as KeycloakErrorResponse;

      // If 'keycloakError.errorMessage' exists as a key in the dictionary,
      // the 'translator' variable will be a function. Otherwise, it will be undefined.
      const translator = keycloakErrorMessages[keycloakError.errorMessage];

      // Calls the function if it exists, passing the 'params', otherwise uses the original 'errorMessage'
      const translatedMessage = translator
        ? translator(keycloakError.params ?? [])
        : (keycloakError.errorMessage ?? 'Unknown error');

      errorMessage = {
        statusCode: error.response.status ?? 500,
        message: translatedMessage,
      };

      logger.error(errorMessage, error.stack);
      throw new HttpException(errorMessage, error.response.status ?? 500);
    }

    // throw error;
  }
}
