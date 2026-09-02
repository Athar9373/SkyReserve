import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  email,
  form,
  FormField,
  FormRoot,
  minLength,
  pattern,
  required,
} from "@angular/forms/signals";
import { NgIcon, provideIcons } from "@ng-icons/core";
import { lucideEye, lucideEyeOff, lucideMail, lucideX } from "@ng-icons/lucide";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmFieldImports } from "@spartan-ng/helm/field";
import { HlmInputGroupImports } from "@spartan-ng/helm/input-group";
import { HlmSpinnerImports } from "@spartan-ng/helm/spinner";
import { Auth } from "../../../core/auth/auth";

@Component({
  selector: "app-login-dialog",
  imports: [
    HlmInputGroupImports,
    NgIcon,
    HlmFieldImports,
    HlmButtonImports,
    FormRoot,
    FormsModule,
    FormField,
    HlmSpinnerImports,
  ],
  providers: [
    provideIcons({
      lucideX,
      lucideMail,
      lucideEye,
      lucideEyeOff,
    }),
  ],
  styleUrl: "./login-dialog.css",
  templateUrl: "./login-dialog.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
})
export class LoginDialog {
  private readonly auth = inject(Auth);
  errorMessage = this.auth.errorMessage;

  readonly showLoginModal = this.auth.showLoginModal;
  readonly showSignUpModal = this.auth.showSignUpModal;
  readonly showForgotPasswordModal = this.auth.showForgotPasswordModal;

  readonly showPassword = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  protected readonly _model = signal({
    email: "",
    password: "",
  });

  public readonly form = form(
    this._model,
    (schemaPath) => {
      required(schemaPath.email, { message: "Email is required" });
      email(schemaPath.email, { message: "Enter a valid email address" });

      required(schemaPath.password, { message: "Password is required" });
      minLength(schemaPath.password, 8, {
        message: "Password must be at least 8 characters",
      });
      pattern(schemaPath.password, /[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      });
      pattern(schemaPath.password, /[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character",
      });
    },
    {
      submission: {
        action: async () => {
          this.isSubmitting.set(true);

          try {
            await this.auth.Login(this._model());
            if (this.auth.isLoggedIn()) {
              this.closeLoginModel();
            }
          } catch (err) {
          } finally {
            this.isSubmitting.set(false);
          }
        },
      },
    },
  );

  toggleShowPassword(): void {
    this.showPassword.update((visible) => !visible);
  }

  closeLoginModel(): void {
    this.showLoginModal.set(false);
    this.errorMessage.set(null);
  }

  onSignUpClick(): void {
    this.showLoginModal.set(false);
    this.showSignUpModal.set(true);
    this.errorMessage.set(null);
  }

  onForgotPasswordClick(): void {
    this.showLoginModal.set(false);
    this.errorMessage.set(null);
    this.showForgotPasswordModal?.set(true);
  }
}
