import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactService } from '../../contact.service';
import { Alert, AlertType } from '../alert/alert';

type FieldName = 'nombre' | 'correo' | 'asunto' | 'mensaje';
type SubmissionState = 'idle' | 'sending' | 'success' | 'error';

@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, Alert],
  templateUrl: './contact-form.html',
  styleUrl: './contact-form.scss',
})
export class ContactForm {
  private readonly formBuilder = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  protected readonly submissionState = signal<SubmissionState>('idle');
  protected readonly statusMessage = signal('');
  protected readonly alertType = signal<AlertType>('info');

  protected readonly contactForm = this.formBuilder.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    asunto: ['', [Validators.required, Validators.maxLength(150)]],
    mensaje: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  protected fieldHasError(fieldName: FieldName): boolean {
    const control = this.contactForm.controls[fieldName];
    return control.invalid && (control.touched || control.dirty);
  }

  protected fieldError(fieldName: FieldName): string {
    const control: AbstractControl = this.contactForm.controls[fieldName];

    if (!this.fieldHasError(fieldName)) {
      return '';
    }

    if (control.hasError('required')) {
      return 'Este campo es obligatorio.';
    }

    if (control.hasError('email')) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (control.hasError('maxlength')) {
      return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    }

    if (control.hasError('server')) {
      return control.getError('server');
    }

    return 'Revisa este campo.';
  }

  protected dismissAlert(): void {
    this.statusMessage.set('');
    this.submissionState.set('idle');
  }

  protected submit(): void {
    this.submissionState.set('idle');
    this.statusMessage.set('');
    this.contactForm.markAllAsTouched();

    if (this.contactForm.invalid) {
      this.submissionState.set('error');
      this.alertType.set('error');
      this.statusMessage.set('Revisa los campos marcados antes de continuar.');
      return;
    }

    this.submissionState.set('sending');
    this.contactForm.disable();

    this.contactService.send(this.contactForm.getRawValue()).subscribe({
      next: (response) => {
        this.contactForm.reset();
        this.contactForm.enable();
        this.submissionState.set('success');
        this.alertType.set('success');
        this.statusMessage.set(response.message);
      },
      error: (error: HttpErrorResponse) => {
        this.contactForm.enable();
        const fieldErrors = error.error?.errors as Partial<Record<FieldName, string>> | undefined;

        if (fieldErrors) {
          for (const [fieldName, message] of Object.entries(fieldErrors)) {
            const control = this.contactForm.controls[fieldName as FieldName];
            control.setErrors({ server: message });
            control.markAsTouched();
          }
        }

        this.submissionState.set('error');
        this.alertType.set('error');
        this.statusMessage.set(
          error.error?.message || 'No fue posible enviar el mensaje. Inténtalo nuevamente.',
        );
      },
    });
  }
}
