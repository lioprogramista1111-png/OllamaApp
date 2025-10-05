import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ERROR_MESSAGES, HTTP_STATUS } from '../constants/app.constants';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  timestamp: Date;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  /**
   * Handle HTTP errors
   * @param error - HTTP error response
   * @returns Observable with formatted error
   */
  handleHttpError(error: HttpErrorResponse): Observable<never> {
    const appError = this.createAppError(error);
    this.logError(appError);
    return throwError(() => appError);
  }

  /**
   * Create formatted application error
   * @param error - Original error
   * @returns Formatted app error
   */
  private createAppError(error: HttpErrorResponse): AppError {
    const appError: AppError = {
      message: this.getErrorMessage(error),
      statusCode: error.status,
      timestamp: new Date(),
      details: error.error
    };

    // Add error code based on status
    if (error.status === HTTP_STATUS.TIMEOUT) {
      appError.code = 'TIMEOUT';
    } else if (error.status >= 500) {
      appError.code = 'SERVER_ERROR';
    } else if (error.status >= 400) {
      appError.code = 'CLIENT_ERROR';
    } else if (error.status === 0) {
      appError.code = 'NETWORK_ERROR';
    }

    return appError;
  }

  /**
   * Get user-friendly error message
   * @param error - HTTP error response
   * @returns Error message
   */
  private getErrorMessage(error: HttpErrorResponse): string {
    // Network error
    if (error.status === 0) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Server error
    if (error.status >= 500) {
      return ERROR_MESSAGES.SERVER_ERROR;
    }

    // Timeout
    if (error.status === HTTP_STATUS.TIMEOUT) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }

    // Not found
    if (error.status === HTTP_STATUS.NOT_FOUND) {
      return error.error?.message || ERROR_MESSAGES.MODEL_NOT_FOUND;
    }

    // Validation error
    if (error.status === HTTP_STATUS.BAD_REQUEST) {
      return error.error?.message || ERROR_MESSAGES.VALIDATION_ERROR;
    }

    // Default to server message or generic error
    return error.error?.message || error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  /**
   * Log error to console (in development) or external service (in production)
   * @param error - Application error
   */
  private logError(error: AppError): void {
    // In development, log to console
    if (!this.isProduction()) {
      console.error('Application Error:', error);
    }

    // In production, send to error tracking service
    // TODO: Integrate with error tracking service (e.g., Sentry, LogRocket)
    // this.sendToErrorTrackingService(error);
  }

  /**
   * Check if running in production
   * @returns True if production
   */
  private isProduction(): boolean {
    return false; // TODO: Get from environment
  }

  /**
   * Handle generic JavaScript errors
   * @param error - Error object
   * @returns Formatted app error
   */
  handleGenericError(error: Error): AppError {
    const appError: AppError = {
      message: error.message || ERROR_MESSAGES.UNKNOWN_ERROR,
      code: 'GENERIC_ERROR',
      timestamp: new Date(),
      details: error
    };

    this.logError(appError);
    return appError;
  }

  /**
   * Create validation error
   * @param message - Validation message
   * @param field - Field name
   * @returns Validation error
   */
  createValidationError(message: string, field?: string): AppError {
    return {
      message,
      code: 'VALIDATION_ERROR',
      statusCode: HTTP_STATUS.BAD_REQUEST,
      timestamp: new Date(),
      details: { field }
    };
  }

  /**
   * Check if error is network error
   * @param error - Error to check
   * @returns True if network error
   */
  isNetworkError(error: AppError): boolean {
    return error.code === 'NETWORK_ERROR' || error.statusCode === 0;
  }

  /**
   * Check if error is server error
   * @param error - Error to check
   * @returns True if server error
   */
  isServerError(error: AppError): boolean {
    return error.code === 'SERVER_ERROR' || (error.statusCode !== undefined && error.statusCode >= 500);
  }

  /**
   * Check if error is timeout
   * @param error - Error to check
   * @returns True if timeout
   */
  isTimeoutError(error: AppError): boolean {
    return error.code === 'TIMEOUT' || error.statusCode === HTTP_STATUS.TIMEOUT;
  }

  /**
   * Get retry-able status
   * @param error - Error to check
   * @returns True if error is retry-able
   */
  isRetryable(error: AppError): boolean {
    return this.isNetworkError(error) || 
           this.isServerError(error) || 
           this.isTimeoutError(error);
  }
}

