import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type OnDestroy,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  disabled,
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  pattern,
  required,
  validate,
} from "@angular/forms/signals";
import { NgIcon, provideIcons } from "@ng-icons/core";
import {
  lucideEye,
  lucideEyeOff,
  lucideRefreshCw,
  lucideX,
} from "@ng-icons/lucide";
import { BrnInputOtpImports } from "@spartan-ng/brain/input-otp";
import { toast } from "@spartan-ng/brain/sonner";
import { HlmButtonImports } from "@spartan-ng/helm/button";
import { HlmFieldImports } from "@spartan-ng/helm/field";
import { HlmInputImports } from "@spartan-ng/helm/input";
import { HlmInputGroupImports } from "@spartan-ng/helm/input-group";
import { HlmInputOtpImports } from "@spartan-ng/helm/input-otp";
import { HlmToasterImports } from "@spartan-ng/helm/sonner";
import { HlmSpinner } from "@spartan-ng/helm/spinner";
import { Auth } from "../../../core/auth/auth";

@Component({
  selector: "app-reset-password",
  imports: [
    FormRoot,
    FormField,
    FormsModule,
    NgIcon,
    HlmButtonImports,
    HlmFieldImports,
    HlmInputImports,
    HlmInputGroupImports,
    BrnInputOtpImports,
    HlmInputOtpImports,
    HlmToasterImports,
    HlmSpinner,
  ],
  providers: [
    provideIcons({
      lucideX,
      lucideEye,
      lucideEyeOff,
      lucideRefreshCw,
    }),
  ],
  templateUrl: "./reset-password.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
})
export class ResetPassword implements OnDestroy {
  private readonly auth = inject(Auth);
  private _intervalId?: ReturnType<typeof setInterval>;

  // Workflow progress signals
  readonly otpSent = signal<boolean>(false);
  readonly otpVerified = signal<boolean>(false);

  readonly isSendingOtp = signal<boolean>(false);
  readonly isVerifyingOtp = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  readonly showPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  readonly errorMessage = this.auth.errorMessage;
  readonly showForgotPasswordModal = this.auth.showForgotPasswordModal;
  readonly showLoginModal = this.auth.showLoginModal;

  // Resend OTP Countdown logic
  readonly countdown = signal(80);
  readonly isResendDisabled = computed(() => this.countdown() > 0);
  readonly otpLength = 6;
  readonly transformPaste = (pastedText: string) =>
    pastedText.replaceAll("-", "");

  // Master Form Data Model
  protected readonly _model = signal({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  public readonly form = form(this._model, (schemaPath) => {
    // 1. Email rules & disabled state
    required(schemaPath.email, { message: "Email is required" });
    email(schemaPath.email, { message: "Enter a valid email address" });

    disabled(schemaPath.email, {
      when: () => this.otpSent(),
    });

    // 2. OTP rules & disabled state
    disabled(schemaPath.otp, {
      when: () => !this.otpSent() || this.otpVerified(),
    });

    required(schemaPath.otp, { message: "OTP is required" });
    minLength(schemaPath.otp, this.otpLength, {
      message: `OTP must be ${this.otpLength} digits`,
    });
    maxLength(schemaPath.otp, this.otpLength, {
      message: `OTP must be ${this.otpLength} digits`,
    });

    // 3. Password rules & disabled state
    disabled(schemaPath.password, {
      when: () => !this.otpVerified(),
    });
    disabled(schemaPath.confirmPassword, {
      when: () => !this.otpVerified(),
    });

    required(schemaPath.password, { message: "New password is required" });
    minLength(schemaPath.password, 8, {
      message: "Password must be at least 8 characters",
    });
    pattern(schemaPath.password, /[A-Z]/, {
      message: "Must contain at least one uppercase letter",
    });
    pattern(schemaPath.password, /[^A-Za-z0-9]/, {
      message: "Must contain at least one special character",
    });

    required(schemaPath.confirmPassword, {
      message: "Confirm password is required",
    });

    // Cross-field validation: runs continuously when passwords change
    validate(schemaPath.confirmPassword, (ctx) => {
      const confirmVal = ctx.value();
      const passVal = ctx.valueOf(schemaPath.password);

      if (confirmVal && passVal && confirmVal !== passVal) {
        return { kind: "error", message: "Passwords do not match" };
      }
      return null;
    });
  });

  async sendOtp(): Promise<void> {
    if (this.form.email().invalid()) return;

    this.isSendingOtp.set(true);
    try {
      await this.auth.SendOtp(this._model().email);
      this.otpSent.set(true);
      toast.info("OTP Sent", {
        description: `Verification code sent to ${this._model().email}`,
      });
      this.resetCountdown();
    } catch {
      toast.error("Failed to Send OTP", {
        description: this.errorMessage() ?? "Please try again after some time.",
      });
    } finally {
      this.isSendingOtp.set(false);
    }
  }

  async resendOtp(): Promise<void> {
    await this.sendOtp();
  }

  async verifyOtp(): Promise<void> {
    if (this.form.otp().invalid()) return;

    this.isVerifyingOtp.set(true);
    try {
      await this.auth.VerifyOtp({
        email: this._model().email,
        otp: this._model().otp,
      });
      this.otpVerified.set(true);
      this.stopCountdown();
      toast.success("OTP Verified", {
        description: "Code verified. You can now reset your password.",
      });
    } catch {
      toast.error("OTP Verification Failed", {
        description: this.errorMessage() ?? "Invalid code. Please try again.",
      });
    } finally {
      this.isVerifyingOtp.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form().invalid()) return;

    this.isSubmitting.set(true);
    try {
      await this.auth.ResetPassword(this._model());
      toast.success("Password Reset Successful", {
        description: "Your password has been reset. Please log in.",
      });
      this.onLoginClicked();
    } catch {
      toast.error("Password Reset Failed", {
        description: this.errorMessage() ?? "Please try again after some time.",
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  toggleShowPassword(): void {
    this.showPassword.update((b) => !b);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update((b) => !b);
  }

  closeDialog(): void {
    this.stopCountdown();
    this.showForgotPasswordModal?.set(false);
  }

  onLoginClicked(): void {
    this.closeDialog();
    this.showLoginModal.set(true);
  }

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  private resetCountdown(): void {
    this.countdown.set(60);
    this.startCountdown();
  }

  private startCountdown(): void {
    this.stopCountdown();
    this._intervalId = setInterval(() => {
      this.countdown.update((c) => Math.max(0, c - 1));
      if (this.countdown() === 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown(): void {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = undefined;
    }
  }
}
