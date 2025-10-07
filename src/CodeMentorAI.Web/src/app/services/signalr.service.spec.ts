import { TestBed } from '@angular/core/testing';
import { SignalRService } from './signalr.service';
import { HubConnection } from '@microsoft/signalr';

describe('SignalRService', () => {
  let service: SignalRService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SignalRService]
    });
    service = TestBed.inject(SignalRService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose connectionState$ observable', (done) => {
    service.connectionState$.subscribe(state => {
      expect(state).toBeDefined();
      expect(typeof state).toBe('string');
      done();
    });
  });

  it('should have initial connection state', (done) => {
    service.connectionState$.subscribe(state => {
      expect(['Disconnected', 'Connected', 'Reconnecting', 'Error']).toContain(state);
      done();
    });
  });

  describe('Connection management', () => {
    it('should provide on method for event subscription', () => {
      expect(service.on).toBeDefined();
      expect(typeof service.on).toBe('function');
    });

    it('should provide off method for event unsubscription', () => {
      expect(service.off).toBeDefined();
      expect(typeof service.off).toBe('function');
    });
  });

  describe('Event handling', () => {
    it('should allow registering event handlers', () => {
      const handler = jasmine.createSpy('handler');
      expect(() => service.on('testEvent', handler)).not.toThrow();
    });

    it('should allow unregistering event handlers', () => {
      const handler = jasmine.createSpy('handler');
      service.on('testEvent', handler);
      expect(() => service.off('testEvent')).not.toThrow();
    });
  });
});

