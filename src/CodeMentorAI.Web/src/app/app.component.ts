import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { ModelSelectorComponent } from './components/model-selector/model-selector.component';
import { SignalRService } from './services/signalr.service';
import { OllamaModel } from './models/ollama.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatSnackBarModule,
    ModelSelectorComponent
  ],
  template: `
    <div class="app-container">
      <mat-toolbar color="primary" class="app-toolbar">
        <button mat-icon-button (click)="toggleSidenav()">
          <mat-icon>menu</mat-icon>
        </button>
        <span class="app-title">CodeMentor AI</span>
        <span class="spacer"></span>
      </mat-toolbar>

      <mat-sidenav-container class="app-sidenav-container">
        <mat-sidenav 
          #sidenav 
          mode="side" 
          opened="true" 
          class="app-sidenav">
          
          <div class="sidenav-content">
            <!-- Model Selector -->
            <div class="model-selector-section">
              <h3>AI Model</h3>
              <app-model-selector
                [userId]="userId"
                [sessionId]="sessionId"
                (modelChanged)="onModelChanged($event)"
                (modelSwitchError)="onModelSwitchError($event)">
              </app-model-selector>
            </div>

            <!-- Navigation Menu -->
            <mat-nav-list class="nav-menu">
              <h3 matSubheader>Features</h3>
              
              <a mat-list-item routerLink="/code-analysis" routerLinkActive="active" (click)="updateRouteState()">
                <mat-icon matListItemIcon>code</mat-icon>
                <span matListItemTitle>Code Analysis</span>
              </a>

              <a mat-list-item routerLink="/chat" routerLinkActive="active" (click)="updateRouteState()">
                <mat-icon matListItemIcon>chat</mat-icon>
                <span matListItemTitle>AI Chat</span>
              </a>

              <a mat-list-item routerLink="/ollama-chat" routerLinkActive="active" (click)="onOllamaChatClick()">
                <mat-icon matListItemIcon>terminal</mat-icon>
                <span matListItemTitle>Ollama Chat</span>
              </a>

              <a mat-list-item routerLink="/documentation" routerLinkActive="active" (click)="updateRouteState()">
                <mat-icon matListItemIcon>description</mat-icon>
                <span matListItemTitle>Documentation</span>
              </a>

              <a mat-list-item routerLink="/code-review" routerLinkActive="active" (click)="updateRouteState()">
                <mat-icon matListItemIcon>rate_review</mat-icon>
                <span matListItemTitle>Code Review</span>
              </a>

              <a mat-list-item routerLink="/learning" routerLinkActive="active" (click)="updateRouteState()">
                <mat-icon matListItemIcon>school</mat-icon>
                <span matListItemTitle>Learning</span>
              </a>

              <mat-divider></mat-divider>

              <h3 matSubheader>Management</h3>
              
              <a mat-list-item routerLink="/models" routerLinkActive="active" (click)="updateRouteState()">
                <mat-icon matListItemIcon>psychology</mat-icon>
                <span matListItemTitle>Model Management</span>
              </a>

              <a mat-list-item routerLink="/browse" routerLinkActive="active" (click)="updateRouteState()">
                <mat-icon matListItemIcon>explore</mat-icon>
                <span matListItemTitle>Browse Models</span>
              </a>

              <a mat-list-item routerLink="/performance" routerLinkActive="active" (click)="updateRouteState()">
                <mat-icon matListItemIcon>analytics</mat-icon>
                <span matListItemTitle>Performance</span>
              </a>
            </mat-nav-list>
          </div>
        </mat-sidenav>

        <mat-sidenav-content class="app-content">
          <div class="content-container">
            <!-- Main Content Area -->
            <div class="main-content">
              <div class="welcome-section" *ngIf="!currentModel">
                <div class="welcome-content">
                  <mat-icon class="welcome-icon">psychology</mat-icon>
                  <h1>Welcome to CodeMentor AI</h1>
                  <p>Select an AI model from the sidebar to get started with intelligent code assistance.</p>
                  <div class="feature-highlights">
                    <div class="feature-item">
                      <mat-icon>code</mat-icon>
                      <span>Code Analysis & Generation</span>
                    </div>
                    <div class="feature-item">
                      <mat-icon>chat</mat-icon>
                      <span>Interactive AI Chat</span>
                    </div>
                    <div class="feature-item">
                      <mat-icon>school</mat-icon>
                      <span>Learning & Tutorials</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="model-active-content" *ngIf="currentModel">
                <div class="active-model-header">
                  <h2>{{ currentModel.displayName }} is Ready</h2>
                  <p>{{ currentModel.description }}</p>
                </div>

                <!-- Router Outlet for different features -->
                <router-outlet></router-outlet>

                <!-- Default content when no route is active -->
                <div class="default-content" *ngIf="!hasActiveRoute">
                  <div class="quick-actions-grid">
                    <div class="quick-action-card" routerLink="/code-analysis">
                      <mat-icon>code</mat-icon>
                      <h3>Analyze Code</h3>
                      <p>Get insights and suggestions for your code</p>
                    </div>

                    <div class="quick-action-card" routerLink="/chat">
                      <mat-icon>chat</mat-icon>
                      <h3>Start Chat</h3>
                      <p>Ask questions and get help with coding</p>
                    </div>

                    <div class="quick-action-card" routerLink="/documentation">
                      <mat-icon>description</mat-icon>
                      <h3>Generate Docs</h3>
                      <p>Create documentation for your code</p>
                    </div>

                    <div class="quick-action-card" routerLink="/learning">
                      <mat-icon>school</mat-icon>
                      <h3>Learn & Practice</h3>
                      <p>Improve your coding skills with AI guidance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'CodeMentor AI';
  userId = 'user-' + Math.random().toString(36).substr(2, 9);
  sessionId = 'session-' + Math.random().toString(36).substr(2, 9);
  currentModel: OllamaModel | null = null;
  hasActiveRoute = false;

  constructor(
    private signalRService: SignalRService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Initialize SignalR connection
    this.signalRService.onConnectionStateChange(state => {
      // Log connection state changes to console only (no popups)
      console.log(`SignalR connection state: ${state}`);

      // No notifications - SignalR is optional for basic chat functionality
      // The Ollama chat works fine without real-time updates
    });

    // Hide default content for all routes except dashboard and root
    const currentPath = window.location.pathname;
    this.hasActiveRoute = currentPath !== '/' && currentPath !== '/dashboard';
    console.log(`Current URL: ${currentPath}, hasActiveRoute: ${this.hasActiveRoute}`);
  }

  toggleSidenav(): void {
    // This would be implemented with ViewChild reference to sidenav
    console.log('Toggle sidenav');
  }

  onOllamaChatClick(): void {
    alert('🚀 Ollama Chat button clicked! Navigating to chat interface...');
    // Update route state after navigation
    setTimeout(() => this.updateRouteState(), 100);
  }

  updateRouteState(): void {
    const currentPath = window.location.pathname;
    this.hasActiveRoute = currentPath !== '/' && currentPath !== '/dashboard';
    console.log(`Route updated: ${currentPath}, hasActiveRoute: ${this.hasActiveRoute}`);
  }

  onModelChanged(model: OllamaModel): void {
    this.currentModel = model;
    this.showSnackBar(`Switched to ${model.displayName}`, 'success');
  }

  onModelSwitchError(error: string): void {
    this.showSnackBar(error, 'error');
  }

  private showSnackBar(message: string, type: 'success' | 'warning' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: [`snackbar-${type}`]
    });
  }
}
