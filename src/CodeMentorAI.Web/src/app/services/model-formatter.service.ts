import { Injectable } from '@angular/core';

/**
 * Shared service for formatting model names consistently across the application.
 * This eliminates code duplication and ensures consistent model name display.
 */
@Injectable({
  providedIn: 'root'
})
export class ModelFormatterService {
  private readonly nameMap: { [key: string]: string } = {
    'llama3.2:latest': 'Llama 3.2',
    'llama3.2': 'Llama 3.2',
    'codellama:latest': 'CodeLlama',
    'codellama': 'CodeLlama',
    'mistral:latest': 'Mistral',
    'mistral': 'Mistral',
    'phi3:latest': 'Phi-3',
    'phi3': 'Phi-3',
    'deepseek-r1:latest': 'Deepseek-R1',
    'deepseek-r1': 'Deepseek-R1',
    'deepseek-r1:14b': 'Deepseek-R1 14B',
    'deepseek-coder:latest': 'Deepseek Coder',
    'deepseek-coder': 'Deepseek Coder'
  };

  /**
   * Format a model name to a human-readable display name
   */
  formatModelName(modelName: string): string {
    if (!modelName) {
      return 'AI Assistant';
    }

    // Check if we have a predefined mapping
    if (this.nameMap[modelName]) {
      return this.nameMap[modelName];
    }

    // Handle special cases for formatting
    const baseName = modelName.split(':')[0];
    
    if (baseName.includes('deepseek')) {
      return baseName.split('-').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }

    // Default: capitalize first letter
    return baseName.charAt(0).toUpperCase() + baseName.slice(1);
  }

  /**
   * Format bytes to GB string
   */
  formatSize(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  }

  /**
   * Get all available model mappings
   */
  getModelMappings(): { [key: string]: string } {
    return { ...this.nameMap };
  }
}

