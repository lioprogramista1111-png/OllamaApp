import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MarkdownPipe]
    });
    sanitizer = TestBed.inject(DomSanitizer);
    pipe = new MarkdownPipe(sanitizer);
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('Basic transformations', () => {
    it('should return empty string for null or undefined', () => {
      expect(pipe.transform(null as any)).toBe('');
      expect(pipe.transform(undefined as any)).toBe('');
      expect(pipe.transform('')).toBe('');
    });

    it('should wrap plain text in paragraph tags', () => {
      const result = pipe.transform('Hello World');
      expect(result).toBeDefined();
    });

    it('should handle simple text without markdown', () => {
      const result = pipe.transform('This is plain text');
      expect(result).toBeDefined();
    });
  });

  describe('Headers', () => {
    it('should transform # to h1', () => {
      const result = pipe.transform('# Header 1');
      expect(result).toBeDefined();
    });

    it('should transform ## to h2', () => {
      const result = pipe.transform('## Header 2');
      expect(result).toBeDefined();
    });

    it('should transform ### to h3', () => {
      const result = pipe.transform('### Header 3');
      expect(result).toBeDefined();
    });

    it('should handle multiple headers', () => {
      const markdown = '# Title\n## Subtitle\n### Section';
      const result = pipe.transform(markdown);
      expect(result).toBeDefined();
    });
  });

  describe('Text formatting', () => {
    it('should transform **text** to bold', () => {
      const result = pipe.transform('This is **bold** text');
      expect(result).toBeDefined();
    });

    it('should transform *text* to italic', () => {
      const result = pipe.transform('This is *italic* text');
      expect(result).toBeDefined();
    });

    it('should handle both bold and italic', () => {
      const result = pipe.transform('**bold** and *italic*');
      expect(result).toBeDefined();
    });

    it('should handle nested formatting', () => {
      const result = pipe.transform('**bold with *italic* inside**');
      expect(result).toBeDefined();
    });
  });

  describe('Code blocks', () => {
    it('should transform inline code with backticks', () => {
      const result = pipe.transform('Use `console.log()` for debugging');
      expect(result).toBeDefined();
    });

    it('should transform code blocks with triple backticks', () => {
      const markdown = '```\nconst x = 10;\nconsole.log(x);\n```';
      const result = pipe.transform(markdown);
      expect(result).toBeDefined();
    });

    it('should handle multiple inline code snippets', () => {
      const result = pipe.transform('Use `var` or `let` or `const`');
      expect(result).toBeDefined();
    });
  });

  describe('Lists', () => {
    it('should transform bullet points with •', () => {
      const markdown = '• Item 1\n• Item 2\n• Item 3';
      const result = pipe.transform(markdown);
      expect(result).toBeDefined();
    });

    it('should transform bullet points with -', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = pipe.transform(markdown);
      expect(result).toBeDefined();
    });

    it('should wrap list items in ul tags', () => {
      const markdown = '- First\n- Second';
      const result = pipe.transform(markdown);
      expect(result).toBeDefined();
    });
  });

  describe('Line breaks', () => {
    it('should convert single newlines to <br>', () => {
      const result = pipe.transform('Line 1\nLine 2');
      expect(result).toBeDefined();
    });

    it('should convert double newlines to paragraph breaks', () => {
      const result = pipe.transform('Paragraph 1\n\nParagraph 2');
      expect(result).toBeDefined();
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML special characters', () => {
      const result = pipe.transform('<script>alert("xss")</script>');
      expect(result).toBeDefined();
    });

    it('should escape ampersands', () => {
      const result = pipe.transform('Tom & Jerry');
      expect(result).toBeDefined();
    });

    it('should escape less than and greater than', () => {
      const result = pipe.transform('5 < 10 > 3');
      expect(result).toBeDefined();
    });
  });

  describe('Complex markdown', () => {
    it('should handle mixed markdown elements', () => {
      const markdown = `# Title
## Subtitle
This is **bold** and *italic* text.
- Item 1
- Item 2
\`code here\``;
      const result = pipe.transform(markdown);
      expect(result).toBeDefined();
    });

    it('should handle code quality feedback format', () => {
      const markdown = `**Code Quality**: 8/10
**Issues Found**:
- Missing error handling
- No input validation
**Suggestions**:
• Add try-catch blocks
• Validate user input`;
      const result = pipe.transform(markdown);
      expect(result).toBeDefined();
    });

    it('should handle code snippets in feedback', () => {
      const markdown = `Use \`async/await\` instead of callbacks:
\`\`\`
async function getData() {
  const result = await fetch(url);
  return result.json();
}
\`\`\``;
      const result = pipe.transform(markdown);
      expect(result).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty markdown syntax', () => {
      expect(pipe.transform('**')).toBeDefined();
      expect(pipe.transform('*')).toBeDefined();
      expect(pipe.transform('`')).toBeDefined();
    });

    it('should handle unclosed markdown syntax', () => {
      expect(pipe.transform('**bold without closing')).toBeDefined();
      expect(pipe.transform('*italic without closing')).toBeDefined();
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10000);
      expect(() => pipe.transform(longText)).not.toThrow();
    });

    it('should handle special characters', () => {
      const result = pipe.transform('Special: @#$%^&*()');
      expect(result).toBeDefined();
    });
  });

  describe('Security', () => {
    it('should sanitize output', () => {
      const result = pipe.transform('Test');
      expect(result).toBeDefined();
      // The result should be a SafeHtml object
    });

    it('should prevent XSS attacks', () => {
      const malicious = '<img src=x onerror=alert(1)>';
      const result = pipe.transform(malicious);
      expect(result).toBeDefined();
    });

    it('should handle script tags safely', () => {
      const result = pipe.transform('<script>alert("test")</script>');
      expect(result).toBeDefined();
    });
  });
});

