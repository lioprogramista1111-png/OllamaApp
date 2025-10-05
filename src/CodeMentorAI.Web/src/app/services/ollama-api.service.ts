import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface ChatRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: any;
}

export interface ChatResponse {
  model: string;
  response: string;
  done: boolean;
  eval_count?: number;
  eval_duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class OllamaApiService {
  private readonly baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  getModels(): Observable<OllamaModel[]> {
    return this.http.get<OllamaModel[]>(`${this.baseUrl}/models`);
  }

  generateChat(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat/generate`, request);
  }

  pullModel(modelName: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/models/${modelName}/pull`, {});
  }

  deleteModel(modelName: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/models/${modelName}`);
  }

  getModelInfo(modelName: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/models/${modelName}`);
  }
}
