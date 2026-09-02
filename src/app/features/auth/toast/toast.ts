import { Component } from "@angular/core";
import { toast } from "@spartan-ng/brain/sonner";
import { HlmButtonImports } from "@spartan-ng/helm/button";

@Component({
  imports: [HlmButtonImports],
  selector: "app-toast",
  styleUrl: "./toast.css",
  template: ` <p>toast works!</p> `,
})
export class Toast {
  showSuccess() {
    toast.success("Login Successful", {
      position: "bottom-center",
    });
  }

  showError() {
    toast.error("Failed to login", {
      position: "bottom-center",
    });
  }
}
