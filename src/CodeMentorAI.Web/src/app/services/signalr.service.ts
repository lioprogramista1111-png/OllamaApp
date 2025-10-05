import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: HubConnection | null = null;
  private connectionStateSubject = new BehaviorSubject<string>('Disconnected');
  
  public connectionState$ = this.connectionStateSubject.asObservable();

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5000/modelhub')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.setupConnectionEvents();
    this.startConnection();
  }

  private setupConnectionEvents(): void {
    if (!this.hubConnection) return;

    this.hubConnection.onclose(() => {
      this.connectionStateSubject.next('Disconnected');
      console.log('SignalR connection closed');
    });

    this.hubConnection.onreconnecting(() => {
      this.connectionStateSubject.next('Reconnecting');
      console.log('SignalR reconnecting...');
    });

    this.hubConnection.onreconnected(() => {
      this.connectionStateSubject.next('Connected');
      console.log('SignalR reconnected');
      this.subscribeToModelUpdates();
    });
  }

  private async startConnection(): Promise<void> {
    if (!this.hubConnection) return;

    try {
      await this.hubConnection.start();
      this.connectionStateSubject.next('Connected');
      console.log('SignalR connection established');
      
      // Subscribe to model updates after connection
      await this.subscribeToModelUpdates();
    } catch (error) {
      this.connectionStateSubject.next('Error');
      console.error('Error starting SignalR connection:', error);
      
      // Retry connection after 5 seconds
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  public async subscribeToModelUpdates(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('SubscribeToModelUpdates');
        console.log('Subscribed to model updates');
      } catch (error) {
        console.error('Error subscribing to model updates:', error);
      }
    }
  }

  public async unsubscribeFromModelUpdates(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('UnsubscribeFromModelUpdates');
        console.log('Unsubscribed from model updates');
      } catch (error) {
        console.error('Error unsubscribing from model updates:', error);
      }
    }
  }

  public async requestModelSwitch(modelName: string, userId: string, sessionId: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('RequestModelSwitch', modelName, userId, sessionId);
        console.log(`Requested model switch to: ${modelName}`);
      } catch (error) {
        console.error('Error requesting model switch:', error);
        throw error;
      }
    } else {
      throw new Error('SignalR connection is not established');
    }
  }

  public async getCurrentModel(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('GetCurrentModel');
      } catch (error) {
        console.error('Error getting current model:', error);
      }
    }
  }

  public async getAvailableModels(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('GetAvailableModels');
      } catch (error) {
        console.error('Error getting available models:', error);
      }
    }
  }

  public async joinModelGroup(modelName: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('JoinModelGroup', modelName);
        console.log(`Joined model group: ${modelName}`);
      } catch (error) {
        console.error('Error joining model group:', error);
      }
    }
  }

  public async leaveModelGroup(modelName: string): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      try {
        await this.hubConnection.invoke('LeaveModelGroup', modelName);
        console.log(`Left model group: ${modelName}`);
      } catch (error) {
        console.error('Error leaving model group:', error);
      }
    }
  }

  public on(methodName: string, callback: (...args: any[]) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on(methodName, callback);
    }
  }

  public off(methodName: string): void {
    if (this.hubConnection) {
      this.hubConnection.off(methodName);
    }
  }

  public isConnected(): boolean {
    return this.hubConnection?.state === 'Connected';
  }

  public getConnectionId(): string | null {
    return this.hubConnection?.connectionId || null;
  }

  public async disconnect(): Promise<void> {
    if (this.hubConnection) {
      await this.unsubscribeFromModelUpdates();
      await this.hubConnection.stop();
      this.connectionStateSubject.next('Disconnected');
      console.log('SignalR connection stopped');
    }
  }

  // Utility method to create observables from SignalR events
  public createObservable<T>(methodName: string): Observable<T> {
    return new Observable<T>(observer => {
      if (this.hubConnection) {
        const handler = (data: T) => observer.next(data);
        this.hubConnection.on(methodName, handler);
        
        return () => {
          if (this.hubConnection) {
            this.hubConnection.off(methodName, handler);
          }
        };
      }
      return () => {};
    });
  }

  // Method to handle connection state changes
  public onConnectionStateChange(callback: (state: string) => void): void {
    this.connectionState$.subscribe(callback);
  }
}
