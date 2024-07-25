// src/timeManager.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'events';

@Injectable()
export class TimeManager extends EventEmitter {
  private readonly operationInterval = 270000; // 4.5 minutes in milliseconds
  private readonly restInterval = 30000; // 30 seconds in milliseconds
  private readonly roundInterval = this.operationInterval + this.restInterval;
  private lastState: 'operation' | 'rest' | null = null;

  constructor() {
    super();
    this.startCycle();
  }

  private startCycle() {
    setInterval(() => {
      const currentState = this.getCurrentState();
      if (currentState !== this.lastState) {
        this.emit(currentState);
        this.lastState = currentState;
      }
    }, 1000);
  }

  getRemainingTime(): number {
    const currentTime = new Date();
    const minutes = currentTime.getUTCMinutes();
    const seconds = currentTime.getUTCSeconds();
    const milliseconds = currentTime.getUTCMilliseconds();
    const totalMilliseconds = (minutes % 5) * 60000 + seconds * 1000 + milliseconds;
    return this.roundInterval - totalMilliseconds;
  }

  getCurrentState(): 'operation' | 'rest' {
    const remainingTime = this.getRemainingTime();
    return remainingTime < this.restInterval ? 'rest' : 'operation';
  }

  getNextEventTime(): number {
    const remainingTime = this.getRemainingTime();
    return remainingTime >= this.operationInterval ? this.roundInterval - remainingTime : this.operationInterval - remainingTime;
  }
}
