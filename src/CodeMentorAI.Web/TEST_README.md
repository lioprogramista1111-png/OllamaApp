# CodeMentorAI Frontend Unit Tests

## Overview

This directory contains comprehensive unit tests for the CodeMentorAI Angular frontend application using Karma and Jasmine.

## Test Framework

- **Karma**: Test runner
- **Jasmine**: Testing framework
- **Angular Testing Utilities**: Component and service testing
- **HttpClientTestingModule**: HTTP request mocking

## Running Tests

### Development Mode (with watch)
```bash
npm test
# or
npm run test:watch
```

### Single Run (CI mode)
```bash
npm run test:headless
```

### With Coverage Report
```bash
npm run test:coverage
```

### CI/CD Pipeline
```bash
npm run test:ci
```

## Test Structure

```
src/
├── app/
│   ├── services/
│   │   ├── model.service.ts
│   │   ├── model.service.spec.ts          ✅ Service tests
│   │   ├── signalr.service.ts
│   │   ├── signalr.service.spec.ts        ✅ SignalR tests
│   │   ├── model-formatter.service.ts
│   │   └── model-formatter.service.spec.ts ✅ Formatter tests
│   ├── pipes/
│   │   ├── markdown.pipe.ts
│   │   └── markdown.pipe.spec.ts          ✅ Pipe tests
│   ├── components/
│   │   └── [component tests]              ✅ Component tests
│   ├── testing/
│   │   └── test-helpers.ts                🛠️ Test utilities
│   └── app.component.spec.ts              ✅ App component tests
├── test.ts                                 ⚙️ Test configuration
└── karma.conf.js                           ⚙️ Karma configuration
```

## Test Coverage

### Services (100% coverage goal)

#### ModelService
- ✅ HTTP requests (GET, POST)
- ✅ Observable streams (models$, currentModel$, isModelSwitching$)
- ✅ Model switching functionality
- ✅ Model information retrieval
- ✅ Error handling
- ✅ Caching mechanism
- ✅ SignalR integration

#### SignalRService
- ✅ Connection management
- ✅ Event subscription/unsubscription
- ✅ Server method invocation
- ✅ Connection state tracking

#### ModelFormatterService
- ✅ Size formatting (bytes to human-readable)
- ✅ Model name formatting
- ✅ Date formatting
- ✅ Parameter size formatting
- ✅ Display name generation
- ✅ Model family extraction
- ✅ Quantization formatting

### Pipes (100% coverage goal)

#### MarkdownPipe
- ✅ Headers (h1, h2, h3)
- ✅ Text formatting (bold, italic)
- ✅ Code blocks (inline and multi-line)
- ✅ Lists (bullet points)
- ✅ Line breaks
- ✅ HTML escaping
- ✅ XSS prevention
- ✅ Complex markdown combinations

### Components

#### AppComponent
- ✅ Component creation
- ✅ Title property
- ✅ Rendering

## Test Helpers

The `testing/test-helpers.ts` file provides utilities for:

### MockDataFactory
- `createMockModel()` - Create mock OllamaModel
- `createMockModels()` - Create multiple mock models
- `createMockPerformanceMetrics()` - Create mock performance data

### DOMHelpers
- `findByCss()` - Find element by selector
- `findAllByCss()` - Find all elements
- `getTextContent()` - Get element text
- `click()` - Click element
- `setInputValue()` - Set input value
- `exists()` - Check element existence
- `hasClass()` - Check CSS class

### AsyncHelpers
- `waitForAsync()` - Wait for async operations
- `flushMicrotasks()` - Flush microtasks

### MaterialHelpers
- `getButtonByText()` - Find Material button
- `clickButtonByText()` - Click Material button
- `getSelectValue()` - Get select value

### HttpHelpers
- `createMockResponse()` - Create mock HTTP response
- `createMockError()` - Create mock HTTP error

### FormHelpers
- `fillField()` - Fill form field
- `submitForm()` - Submit form
- `isFormValid()` - Check form validity

## Writing Tests

### Service Test Example

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MyService } from './my.service';

describe('MyService', () => {
  let service: MyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MyService]
    });
    service = TestBed.inject(MyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch data', (done) => {
    service.getData().subscribe(data => {
      expect(data).toBeDefined();
      done();
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ result: 'success' });
  });
});
```

### Component Test Example

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MyComponent } from './my.component';
import { DOMHelpers } from '../testing/test-helpers';

describe('MyComponent', () => {
  let component: MyComponent;
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  it('should display title', () => {
    fixture.detectChanges();
    const title = DOMHelpers.getTextContent(fixture, 'h1');
    expect(title).toBe('My Component');
  });
});
```

### Pipe Test Example

```typescript
import { MyPipe } from './my.pipe';

describe('MyPipe', () => {
  let pipe: MyPipe;

  beforeEach(() => {
    pipe = new MyPipe();
  });

  it('should transform value', () => {
    expect(pipe.transform('input')).toBe('output');
  });
});
```

## Coverage Reports

After running tests with coverage, view the report:

```bash
# Open coverage report in browser
open coverage/code-mentor-ai-web/index.html
# or on Windows
start coverage/code-mentor-ai-web/index.html
```

### Coverage Thresholds

- **Statements**: 70%
- **Branches**: 60%
- **Functions**: 70%
- **Lines**: 70%

## Best Practices

### 1. Test Naming
- Use descriptive test names: `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks

### 2. Test Structure (AAA Pattern)
```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const input = 'test';
  
  // Act - Execute the code
  const result = service.doSomething(input);
  
  // Assert - Verify the result
  expect(result).toBe('expected');
});
```

### 3. Async Testing
```typescript
it('should handle async operations', (done) => {
  service.asyncMethod().subscribe(result => {
    expect(result).toBeDefined();
    done(); // Signal test completion
  });
});

// Or use async/await
it('should handle async operations', async () => {
  const result = await service.asyncMethod().toPromise();
  expect(result).toBeDefined();
});
```

### 4. Mocking Dependencies
```typescript
const mockService = jasmine.createSpyObj('MyService', ['method1', 'method2']);
mockService.method1.and.returnValue(of('mocked value'));
```

### 5. Testing Observables
```typescript
it('should emit values', (done) => {
  service.observable$.subscribe(value => {
    expect(value).toBe('expected');
    done();
  });
});
```

## Debugging Tests

### Run Single Test File
```bash
ng test --include='**/my.service.spec.ts'
```

### Focus on Single Test
```typescript
fit('should run only this test', () => {
  // test code
});
```

### Skip Test
```typescript
xit('should skip this test', () => {
  // test code
});
```

### Browser Debugging
1. Run `npm test`
2. Click "DEBUG" button in Karma browser
3. Open browser DevTools
4. Set breakpoints in test code

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run tests
  run: npm run test:ci

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/code-mentor-ai-web/lcov.info
```

### Azure Pipelines Example
```yaml
- script: npm run test:ci
  displayName: 'Run unit tests'

- task: PublishCodeCoverageResults@1
  inputs:
    codeCoverageTool: 'Cobertura'
    summaryFileLocation: '$(System.DefaultWorkingDirectory)/coverage/code-mentor-ai-web/cobertura-coverage.xml'
```

## Troubleshooting

### Tests Timing Out
- Increase timeout in `karma.conf.js`: `browserNoActivityTimeout: 60000`
- Use `done()` callback for async tests

### Chrome Not Found
- Install Chrome or use ChromeHeadless
- Update `karma.conf.js` browsers configuration

### Module Not Found
- Check imports in test files
- Ensure all dependencies are in `TestBed.configureTestingModule`

### Coverage Not Generated
- Run with `--code-coverage` flag
- Check `karma.conf.js` coverage reporter configuration

## Resources

- [Angular Testing Guide](https://angular.io/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Documentation](https://karma-runner.github.io/)
- [Testing Best Practices](https://angular.io/guide/testing-best-practices)

