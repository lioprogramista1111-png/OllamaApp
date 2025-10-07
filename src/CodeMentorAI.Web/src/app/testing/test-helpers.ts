/**
 * Test Helpers and Utilities for Angular Unit Tests
 */

import { DebugElement } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { OllamaModel, ModelPerformanceMetrics } from '../models/ollama.models';

/**
 * Mock data factory for creating test models
 */
export class MockDataFactory {
  static createMockModel(overrides?: Partial<OllamaModel>): OllamaModel {
    return {
      name: 'test-model',
      size: 3825819519,
      digest: 'abc123def456',
      modified_at: new Date().toISOString(),
      details: {
        format: 'gguf',
        family: 'llama',
        families: ['llama'],
        parameter_size: '7B',
        quantization_level: 'Q4_0'
      },
      ...overrides
    };
  }

  static createMockModels(count: number = 3): OllamaModel[] {
    return Array.from({ length: count }, (_, i) => 
      this.createMockModel({ 
        name: `model-${i + 1}`,
        digest: `digest-${i + 1}`
      })
    );
  }

  static createMockPerformanceMetrics(overrides?: Partial<ModelPerformanceMetrics>): ModelPerformanceMetrics {
    return {
      modelName: 'test-model',
      averageResponseTime: 1500,
      totalRequests: 100,
      successRate: 0.95,
      averageTokensPerSecond: 50,
      lastUsed: new Date().toISOString(),
      ...overrides
    };
  }
}

/**
 * DOM query helpers
 */
export class DOMHelpers {
  /**
   * Find element by CSS selector
   */
  static findByCss<T>(fixture: ComponentFixture<T>, selector: string): DebugElement {
    return fixture.debugElement.query(By.css(selector));
  }

  /**
   * Find all elements by CSS selector
   */
  static findAllByCss<T>(fixture: ComponentFixture<T>, selector: string): DebugElement[] {
    return fixture.debugElement.queryAll(By.css(selector));
  }

  /**
   * Get text content of element
   */
  static getTextContent<T>(fixture: ComponentFixture<T>, selector: string): string {
    const element = this.findByCss(fixture, selector);
    return element ? element.nativeElement.textContent.trim() : '';
  }

  /**
   * Click element
   */
  static click<T>(fixture: ComponentFixture<T>, selector: string): void {
    const element = this.findByCss(fixture, selector);
    if (element) {
      element.nativeElement.click();
      fixture.detectChanges();
    }
  }

  /**
   * Set input value
   */
  static setInputValue<T>(fixture: ComponentFixture<T>, selector: string, value: string): void {
    const element = this.findByCss(fixture, selector);
    if (element) {
      const input = element.nativeElement as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  }

  /**
   * Check if element exists
   */
  static exists<T>(fixture: ComponentFixture<T>, selector: string): boolean {
    return !!this.findByCss(fixture, selector);
  }

  /**
   * Check if element has class
   */
  static hasClass<T>(fixture: ComponentFixture<T>, selector: string, className: string): boolean {
    const element = this.findByCss(fixture, selector);
    return element ? element.nativeElement.classList.contains(className) : false;
  }
}

/**
 * Async test helpers
 */
export class AsyncHelpers {
  /**
   * Wait for async operations to complete
   */
  static async waitForAsync(ms: number = 0): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Flush microtasks
   */
  static flushMicrotasks(): Promise<void> {
    return new Promise(resolve => {
      Promise.resolve().then(() => resolve());
    });
  }
}

/**
 * Spy helpers for Jasmine
 */
export class SpyHelpers {
  /**
   * Create a spy object with multiple methods
   */
  static createSpyObj<T>(baseName: string, methodNames: string[]): jasmine.SpyObj<T> {
    return jasmine.createSpyObj<T>(baseName, methodNames);
  }

  /**
   * Create a spy that returns an observable
   */
  static createObservableSpy(returnValue: any): jasmine.Spy {
    return jasmine.createSpy().and.returnValue(returnValue);
  }
}

/**
 * Material component helpers
 */
export class MaterialHelpers {
  /**
   * Get Material button by text
   */
  static getButtonByText<T>(fixture: ComponentFixture<T>, text: string): DebugElement | null {
    const buttons = DOMHelpers.findAllByCss(fixture, 'button');
    return buttons.find(btn => btn.nativeElement.textContent.trim() === text) || null;
  }

  /**
   * Click Material button by text
   */
  static clickButtonByText<T>(fixture: ComponentFixture<T>, text: string): void {
    const button = this.getButtonByText(fixture, text);
    if (button) {
      button.nativeElement.click();
      fixture.detectChanges();
    }
  }

  /**
   * Get Material select value
   */
  static getSelectValue<T>(fixture: ComponentFixture<T>, selector: string): string {
    const select = DOMHelpers.findByCss(fixture, selector);
    return select ? select.nativeElement.value : '';
  }
}

/**
 * HTTP testing helpers
 */
export class HttpHelpers {
  /**
   * Create mock HTTP response
   */
  static createMockResponse<T>(data: T, status: number = 200): any {
    return {
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      body: data
    };
  }

  /**
   * Create mock HTTP error
   */
  static createMockError(status: number = 500, message: string = 'Server Error'): any {
    return {
      status,
      statusText: message,
      error: { message }
    };
  }
}

/**
 * Form testing helpers
 */
export class FormHelpers {
  /**
   * Fill form field
   */
  static fillField<T>(fixture: ComponentFixture<T>, fieldName: string, value: string): void {
    DOMHelpers.setInputValue(fixture, `[formControlName="${fieldName}"]`, value);
  }

  /**
   * Submit form
   */
  static submitForm<T>(fixture: ComponentFixture<T>, formSelector: string = 'form'): void {
    const form = DOMHelpers.findByCss(fixture, formSelector);
    if (form) {
      form.nativeElement.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
    }
  }

  /**
   * Check if form is valid
   */
  static isFormValid<T>(component: any): boolean {
    return component.form?.valid ?? false;
  }
}

/**
 * Router testing helpers
 */
export class RouterHelpers {
  /**
   * Create mock ActivatedRoute
   */
  static createMockActivatedRoute(params: any = {}, queryParams: any = {}): any {
    return {
      snapshot: {
        params,
        queryParams
      },
      params: { subscribe: (fn: Function) => fn(params) },
      queryParams: { subscribe: (fn: Function) => fn(queryParams) }
    };
  }
}

/**
 * Observable testing helpers
 */
export class ObservableHelpers {
  /**
   * Create a simple observable that emits once
   */
  static createSimpleObservable<T>(value: T): any {
    return {
      subscribe: (fn: Function) => {
        fn(value);
        return { unsubscribe: () => {} };
      }
    };
  }
}

