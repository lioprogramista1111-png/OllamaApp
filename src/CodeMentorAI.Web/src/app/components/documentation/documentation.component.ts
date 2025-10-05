import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-documentation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="documentation-container">
      <div class="doc-header">
        <h1>📚 CodeMentor AI Documentation</h1>
        <p class="subtitle">Your comprehensive guide to using CodeMentor AI</p>
      </div>

      <div class="doc-content">
        <!-- Quick Start Section -->
        <section class="doc-section">
          <h2>🚀 Quick Start</h2>
          <div class="section-content">
            <p>CodeMentor AI is an intelligent code assistant powered by local Ollama models. Get started in three simple steps:</p>
            <ol class="steps-list">
              <li>
                <strong>Select a Model:</strong> Use the "Active Model" dropdown in the sidebar to choose from available AI models
              </li>
              <li>
                <strong>Choose a Feature:</strong> Navigate to Code Analysis, AI Chat, or other features from the sidebar menu
              </li>
              <li>
                <strong>Start Coding:</strong> Paste your code or ask questions to get instant AI-powered assistance
              </li>
            </ol>
          </div>
        </section>

        <!-- Features Overview Section -->
        <section class="doc-section">
          <h2>✨ Features Overview</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">💬</div>
              <h3>AI Chat</h3>
              <p>Interactive conversation with AI models for coding help, explanations, and problem-solving.</p>
              <ul>
                <li>Real-time responses</li>
                <li>Code syntax highlighting</li>
                <li>Auto-scroll to latest messages</li>
                <li>Conversation history</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🔍</div>
              <h3>Code Analysis</h3>
              <p>Deep analysis of your code with intelligent suggestions and improvements.</p>
              <ul>
                <li>Code quality assessment</li>
                <li>Bug detection</li>
                <li>Performance optimization</li>
                <li>Security vulnerability checks</li>
                <li>Refactoring suggestions</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🧠</div>
              <h3>Model Management</h3>
              <p>Manage your AI models with an intuitive interface.</p>
              <ul>
                <li>View installed models</li>
                <li>Delete unused models</li>
                <li>Monitor model sizes</li>
                <li>Quick model switching</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">📥</div>
              <h3>Download Models</h3>
              <p>Download new AI models from the Ollama registry.</p>
              <ul>
                <li>Browse popular models</li>
                <li>Download from URLs</li>
                <li>Track download progress</li>
                <li>Automatic installation</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Available Models Section -->
        <section class="doc-section">
          <h2>🤖 Available Models</h2>
          <div class="section-content">
            <p>CodeMentor AI supports various Ollama models, each optimized for different tasks:</p>
            
            <div class="model-info">
              <h3>Code Llama</h3>
              <p class="model-description">Specialized for code generation, analysis, and debugging.</p>
              <div class="model-capabilities">
                <span class="capability">✅ Code Analysis</span>
                <span class="capability">✅ Code Generation</span>
                <span class="capability">✅ Debugging</span>
                <span class="capability">✅ Code Review</span>
              </div>
              <p class="model-best-for"><strong>Best for:</strong> Code-related tasks, bug fixing, refactoring</p>
            </div>

            <div class="model-info">
              <h3>Llama 3.2</h3>
              <p class="model-description">General-purpose language model for various AI tasks.</p>
              <div class="model-capabilities">
                <span class="capability">✅ Chat</span>
                <span class="capability">✅ Documentation</span>
                <span class="capability">⚪ Code Analysis</span>
              </div>
              <p class="model-best-for"><strong>Best for:</strong> General questions, explanations, learning</p>
            </div>

            <div class="model-info">
              <h3>Mistral</h3>
              <p class="model-description">Fast and efficient language model.</p>
              <div class="model-capabilities">
                <span class="capability">✅ Chat</span>
                <span class="capability">✅ Documentation</span>
                <span class="capability">⚪ Code Generation</span>
              </div>
              <p class="model-best-for"><strong>Best for:</strong> Quick responses, documentation generation</p>
            </div>

            <div class="model-info">
              <h3>DeepSeek R1 14B</h3>
              <p class="model-description">Large language model for complex reasoning tasks.</p>
              <div class="model-capabilities">
                <span class="capability">✅ Chat</span>
                <span class="capability">✅ Documentation</span>
                <span class="capability">✅ Complex Reasoning</span>
              </div>
              <p class="model-best-for"><strong>Best for:</strong> Complex problems, detailed explanations</p>
            </div>

            <div class="model-info">
              <h3>Phi</h3>
              <p class="model-description">Small but capable model for various tasks.</p>
              <div class="model-capabilities">
                <span class="capability">✅ Chat</span>
                <span class="capability">✅ Documentation</span>
                <span class="capability">⚪ Lightweight Tasks</span>
              </div>
              <p class="model-best-for"><strong>Best for:</strong> Quick tasks, low resource usage</p>
            </div>
          </div>
        </section>

        <!-- How to Use Section -->
        <section class="doc-section">
          <h2>📖 How to Use</h2>
          <div class="section-content">
            
            <div class="usage-guide">
              <h3>Using AI Chat</h3>
              <ol>
                <li>Navigate to <strong>Ollama Chat</strong> from the sidebar</li>
                <li>Select your preferred model from the dropdown</li>
                <li>Type your question or code-related query</li>
                <li>Press Enter or click Send</li>
                <li>View the AI's response with syntax highlighting</li>
              </ol>
            </div>

            <div class="usage-guide">
              <h3>Using Code Analysis</h3>
              <ol>
                <li>Navigate to <strong>Code Analysis</strong> from the sidebar</li>
                <li>Select the programming language</li>
                <li>Paste your code in the editor</li>
                <li>Choose analysis options (Quality, Performance, Security, Bugs, Refactoring)</li>
                <li>Click <strong>Analyze Code</strong></li>
                <li>Review the detailed feedback and suggestions</li>
              </ol>
            </div>

            <div class="usage-guide">
              <h3>Managing Models</h3>
              <ol>
                <li>Navigate to <strong>Model Management</strong> from the sidebar</li>
                <li>View all installed models with their sizes</li>
                <li>Click the <strong>🗑️ Remove</strong> button to delete a model</li>
                <li>Confirm deletion to free up disk space</li>
              </ol>
            </div>

            <div class="usage-guide">
              <h3>Downloading New Models</h3>
              <ol>
                <li>Navigate to <strong>Download Models</strong> from the sidebar</li>
                <li>Browse popular models or paste an Ollama URL</li>
                <li>Click <strong>Download</strong> on your chosen model</li>
                <li>Wait for the download to complete</li>
                <li>The model will appear in your Active Model dropdown</li>
              </ol>
            </div>
          </div>
        </section>

        <!-- Tips & Best Practices Section -->
        <section class="doc-section">
          <h2>💡 Tips & Best Practices</h2>
          <div class="section-content">
            <div class="tips-grid">
              <div class="tip-card">
                <div class="tip-icon">🎯</div>
                <h3>Choose the Right Model</h3>
                <p>Use <strong>Code Llama</strong> for code-specific tasks and <strong>Llama 3.2</strong> for general questions.</p>
              </div>

              <div class="tip-card">
                <div class="tip-icon">📝</div>
                <h3>Be Specific</h3>
                <p>Provide clear context and specific questions for better AI responses.</p>
              </div>

              <div class="tip-card">
                <div class="tip-icon">🔄</div>
                <h3>Iterate</h3>
                <p>If the first response isn't perfect, refine your question and ask again.</p>
              </div>

              <div class="tip-card">
                <div class="tip-icon">💾</div>
                <h3>Manage Storage</h3>
                <p>Delete unused models to free up disk space. Models can be re-downloaded anytime.</p>
              </div>

              <div class="tip-card">
                <div class="tip-icon">⚡</div>
                <h3>Performance</h3>
                <p>Smaller models (Phi, TinyLlama) respond faster but may be less accurate for complex tasks.</p>
              </div>

              <div class="tip-card">
                <div class="tip-icon">🔒</div>
                <h3>Privacy</h3>
                <p>All processing happens locally on your machine. Your code never leaves your computer.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Technical Details Section -->
        <section class="doc-section">
          <h2>⚙️ Technical Details</h2>
          <div class="section-content">
            <h3>Architecture</h3>
            <p>CodeMentor AI is built with:</p>
            <ul class="tech-list">
              <li><strong>Frontend:</strong> Angular 17+ with standalone components</li>
              <li><strong>Backend:</strong> ASP.NET Core 8.0 Web API</li>
              <li><strong>AI Engine:</strong> Ollama (local AI model runtime)</li>
              <li><strong>Real-time:</strong> SignalR for live updates</li>
              <li><strong>UI:</strong> Angular Material Design</li>
            </ul>

            <h3>System Requirements</h3>
            <ul class="tech-list">
              <li><strong>OS:</strong> Windows, macOS, or Linux</li>
              <li><strong>RAM:</strong> 8GB minimum (16GB recommended)</li>
              <li><strong>Storage:</strong> 10GB+ for models</li>
              <li><strong>Ollama:</strong> Must be installed and running</li>
            </ul>

            <h3>API Endpoints</h3>
            <ul class="tech-list">
              <li><code>GET /api/models</code> - Get all installed models</li>
              <li><code>DELETE /api/models/:name</code> - Remove a model</li>
              <li><code>POST /api/models/:name/pull</code> - Download a model</li>
              <li><code>POST /api/codeanalysis</code> - Analyze code</li>
            </ul>
          </div>
        </section>

        <!-- Troubleshooting Section -->
        <section class="doc-section">
          <h2>🔧 Troubleshooting</h2>
          <div class="section-content">
            <div class="troubleshooting-item">
              <h3>❌ No models showing in dropdown</h3>
              <p><strong>Solution:</strong> Make sure Ollama is running and you have at least one model installed. Run <code>ollama list</code> in terminal to check.</p>
            </div>

            <div class="troubleshooting-item">
              <h3>❌ Model deletion not working</h3>
              <p><strong>Solution:</strong> Refresh the page after deletion. The model is removed from your hard drive via Ollama API.</p>
            </div>

            <div class="troubleshooting-item">
              <h3>❌ Slow responses</h3>
              <p><strong>Solution:</strong> Try using a smaller model (Phi, TinyLlama) or ensure no other heavy applications are running.</p>
            </div>

            <div class="troubleshooting-item">
              <h3>❌ Connection errors</h3>
              <p><strong>Solution:</strong> Verify that both the backend API (port 5000) and Ollama (port 11434) are running.</p>
            </div>
          </div>
        </section>

        <!-- Support Section -->
        <section class="doc-section">
          <h2>🆘 Support</h2>
          <div class="section-content">
            <p>Need help? Here are your options:</p>
            <ul class="support-list">
              <li>📖 Check this documentation for common questions</li>
              <li>🐛 Report bugs on the GitHub Issues page</li>
              <li>💬 Join community discussions</li>
              <li>📧 Contact support for technical assistance</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .documentation-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      background: #ffffff;
      min-height: 100vh;
    }

    .doc-header {
      text-align: center;
      padding: 40px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 40px;
    }

    .doc-header h1 {
      margin: 0 0 12px 0;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .subtitle {
      margin: 0;
      font-size: 1.2rem;
      opacity: 0.95;
    }

    .doc-content {
      padding: 0 20px;
    }

    .doc-section {
      margin-bottom: 48px;
      padding-bottom: 32px;
      border-bottom: 2px solid #f0f0f0;
    }

    .doc-section:last-child {
      border-bottom: none;
    }

    .doc-section h2 {
      color: #333;
      font-size: 2rem;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 3px solid #667eea;
    }

    .section-content {
      line-height: 1.8;
      color: #555;
    }

    .steps-list {
      background: #f8f9fa;
      padding: 24px 24px 24px 48px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .steps-list li {
      margin-bottom: 16px;
      font-size: 1.05rem;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-top: 24px;
    }

    .feature-card {
      background: #f8f9fa;
      padding: 24px;
      border-radius: 12px;
      border: 2px solid #e9ecef;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      border-color: #667eea;
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 16px;
    }

    .feature-card h3 {
      color: #333;
      margin: 0 0 12px 0;
      font-size: 1.4rem;
    }

    .feature-card p {
      color: #666;
      margin-bottom: 16px;
    }

    .feature-card ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .feature-card ul li {
      padding: 6px 0;
      color: #555;
      font-size: 0.95rem;
    }

    .feature-card ul li:before {
      content: "✓ ";
      color: #28a745;
      font-weight: bold;
      margin-right: 8px;
    }

    .model-info {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
    }

    .model-info h3 {
      color: #333;
      margin: 0 0 8px 0;
    }

    .model-description {
      color: #666;
      margin: 8px 0;
    }

    .model-capabilities {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 12px 0;
    }

    .capability {
      background: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 0.85rem;
      border: 1px solid #dee2e6;
    }

    .model-best-for {
      margin: 12px 0 0 0;
      color: #555;
      font-size: 0.95rem;
    }

    .usage-guide {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .usage-guide h3 {
      color: #333;
      margin: 0 0 16px 0;
    }

    .usage-guide ol {
      margin: 0;
      padding-left: 24px;
    }

    .usage-guide ol li {
      margin-bottom: 12px;
      color: #555;
    }

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }

    .tip-card {
      background: #fff3cd;
      padding: 20px;
      border-radius: 8px;
      border: 2px solid #ffc107;
    }

    .tip-icon {
      font-size: 2rem;
      margin-bottom: 12px;
    }

    .tip-card h3 {
      color: #333;
      margin: 0 0 8px 0;
      font-size: 1.1rem;
    }

    .tip-card p {
      color: #666;
      margin: 0;
      font-size: 0.95rem;
    }

    .tech-list {
      background: #f8f9fa;
      padding: 20px 20px 20px 40px;
      border-radius: 8px;
      margin: 16px 0;
    }

    .tech-list li {
      margin-bottom: 12px;
      color: #555;
    }

    .tech-list code {
      background: #e9ecef;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #d63384;
    }

    .troubleshooting-item {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 16px;
      border-left: 4px solid #dc3545;
    }

    .troubleshooting-item h3 {
      color: #dc3545;
      margin: 0 0 12px 0;
      font-size: 1.1rem;
    }

    .troubleshooting-item p {
      margin: 0;
      color: #555;
    }

    .troubleshooting-item code {
      background: #e9ecef;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #d63384;
    }

    .support-list {
      background: #f8f9fa;
      padding: 20px 20px 20px 40px;
      border-radius: 8px;
      margin: 16px 0;
    }

    .support-list li {
      margin-bottom: 12px;
      color: #555;
      font-size: 1.05rem;
    }

    @media (max-width: 768px) {
      .doc-header h1 {
        font-size: 2rem;
      }

      .features-grid,
      .tips-grid {
        grid-template-columns: 1fr;
      }

      .documentation-container {
        padding: 16px;
      }
    }
  `]
})
export class DocumentationComponent {
}

