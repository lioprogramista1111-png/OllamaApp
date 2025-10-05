import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onOverlayClick($event)">
      <div class="modal-dialog" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-btn" (click)="onCancel()">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="icon-container">
            <span class="warning-icon">⚠️</span>
          </div>
          <p class="message">{{ message }}</p>
          <p class="sub-message" *ngIf="subMessage">{{ subMessage }}</p>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-cancel" (click)="onCancel()">
            {{ cancelText }}
          </button>
          <button class="btn btn-confirm" (click)="onConfirm()">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-in-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-dialog {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 90%;
      animation: slideIn 0.3s ease-out;
      overflow: hidden;
    }

    @keyframes slideIn {
      from {
        transform: translateY(-50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, #f5f5f5, #ffffff);
    }

    .modal-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 28px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f0f0f0;
      color: #333;
    }

    .modal-body {
      padding: 32px 24px;
      text-align: center;
    }

    .icon-container {
      margin-bottom: 20px;
    }

    .warning-icon {
      font-size: 64px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
    }

    .message {
      font-size: 16px;
      color: #333;
      margin: 0 0 12px 0;
      font-weight: 500;
      line-height: 1.5;
    }

    .sub-message {
      font-size: 14px;
      color: #666;
      margin: 0;
      line-height: 1.5;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      background: #fafafa;
    }

    .btn {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 100px;
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #666;
      border: 1px solid #ddd;
    }

    .btn-cancel:hover {
      background: #e0e0e0;
      color: #333;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #f44336, #d32f2f);
      color: white;
      box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
    }

    .btn-confirm:hover {
      background: linear-gradient(135deg, #d32f2f, #c62828);
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
      transform: translateY(-1px);
    }

    .btn-confirm:active {
      transform: translateY(0);
    }

    @media (max-width: 600px) {
      .modal-dialog {
        width: 95%;
        margin: 20px;
      }

      .modal-footer {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() subMessage = '';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
    this.isOpen = false;
  }

  onCancel() {
    this.cancelled.emit();
    this.isOpen = false;
  }

  onOverlayClick(event: MouseEvent) {
    this.onCancel();
  }
}

