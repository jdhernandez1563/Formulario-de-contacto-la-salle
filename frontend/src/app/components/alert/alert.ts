import { Component, input, output } from '@angular/core';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

@Component({
  selector: 'app-alert',
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
})
export class Alert {
  readonly type = input.required<AlertType>();
  readonly message = input.required<string>();
  readonly closed = output<void>();

  protected get icon(): string {
    switch (this.type()) {
      case 'success':
        return '✓';
      case 'error':
        return '!';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'i';
    }
  }

  protected get title(): string {
    switch (this.type()) {
      case 'success':
        return 'Mensaje enviado';
      case 'error':
        return 'Ocurrió un error';
      case 'warning':
        return 'Atención';
      case 'info':
      default:
        return 'Información';
    }
  }

  protected close(): void {
    this.closed.emit();
  }
}
