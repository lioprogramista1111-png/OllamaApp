import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, timeout, retry } from 'rxjs/operators';
import { ErrorHandlerService } from '../services/error-handler.service';
import { LoggerService } from '../services/logger.service';
import { API_CONFIG } from '../constants/app.constants';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(
    private errorHandler: ErrorHandlerService,
    private logger: LoggerService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const timerId = this.logger.startTimer(`HTTP_${request.method}_${request.url}`);

    return next.handle(request).pipe(
      // Add timeout
      timeout(API_CONFIG.TIMEOUT),

      // Retry on network errors
      retry({
        count: API_CONFIG.RETRY_ATTEMPTS,
        delay: (error, retryCount) => {
          // Only retry on network errors or 5xx errors
          if (error instanceof HttpErrorResponse) {
            if (error.status === 0 || error.status >= 500) {
              this.logger.warn(
                `Retrying request (attempt ${retryCount}/${API_CONFIG.RETRY_ATTEMPTS})`,
                { url: request.url, status: error.status },
                'HttpInterceptor'
              );
              return new Observable(subscriber => {
                setTimeout(() => {
                  subscriber.next();
                  subscriber.complete();
                }, API_CONFIG.RETRY_DELAY * retryCount);
              });
            }
          }
          throw error;
        }
      }),

      // Log successful responses
      tap(event => {
        if (event instanceof HttpResponse) {
          this.logger.endTimer(timerId, {
            status: event.status,
            url: request.url
          });
          
          this.logger.debug(
            `HTTP ${request.method} ${request.url} - ${event.status}`,
            { response: event.body },
            'HttpInterceptor'
          );
        }
      }),

      // Handle errors
      catchError((error: HttpErrorResponse) => {
        this.logger.endTimer(timerId, {
          status: error.status,
          url: request.url,
          error: true
        });

        this.logger.error(
          `HTTP ${request.method} ${request.url} failed`,
          {
            status: error.status,
            message: error.message,
            error: error.error
          },
          'HttpInterceptor'
        );

        return this.errorHandler.handleHttpError(error);
      })
    );
  }
}

