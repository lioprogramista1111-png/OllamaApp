import { Component } from '@angular/core';
import { SimpleOllamaChatComponent } from './components/ollama-chat/simple-ollama-chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SimpleOllamaChatComponent],
  template: `
    <div style="padding: 20px; background: #f0f2f5; min-height: 100vh;">
      <h1 style="text-align: center; color: #333; margin-bottom: 30px;">
        🚀 CodeMentor AI - Ollama Chat
      </h1>
      <app-simple-ollama-chat></app-simple-ollama-chat>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f5f5f5;
    }
  `]
})
export class AppComponent {
  title = 'CodeMentor AI - Simple Test';
  
  constructor() {
    console.log('🎯 Simple App Component loaded!');
  }
}
