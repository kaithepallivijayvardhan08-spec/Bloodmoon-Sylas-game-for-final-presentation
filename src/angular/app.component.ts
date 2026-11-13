import {
  AfterViewInit,
  ApplicationRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import ReactApp from '../App';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main class="angular-shell">
      <div #reactHost class="react-game-host" aria-label="Bloodmoon: Sylas game"></div>
    </main>
  `,
  styles: [`
    :host, .angular-shell, .react-game-host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100vh;
      margin: 0;
      padding: 0;
    }
    .angular-shell {
      overflow: hidden;
      background: #05070c;
    }
  `],
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @ViewChild('reactHost', { static: true })
  private reactHost!: ElementRef<HTMLDivElement>;

  private reactRoot: Root | null = null;

  ngAfterViewInit(): void {
    this.reactRoot = createRoot(this.reactHost.nativeElement);
    this.reactRoot.render(
      React.createElement(React.StrictMode, null, React.createElement(ReactApp)),
    );
  }

  ngOnDestroy(): void {
    this.reactRoot?.unmount();
    this.reactRoot = null;
  }
}
