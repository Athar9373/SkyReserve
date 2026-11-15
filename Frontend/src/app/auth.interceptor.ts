import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers
    .set('ngrok-skip-browser-warning', '69420')
    .set('Content-Type', 'application/json');

  const rawUserInfo = localStorage.getItem('user_info');

  if (rawUserInfo) {
    try {
      const user = JSON.parse(rawUserInfo) as { token?: unknown };
      const apiBase = new URL(environment.apiUrl);
      const requestUrl = new URL(req.url, apiBase);
      const apiPath = apiBase.pathname.replace(/\/$/, '');
      const isApiRequest =
        requestUrl.origin === apiBase.origin &&
        (!apiPath || requestUrl.pathname === apiPath || requestUrl.pathname.startsWith(`${apiPath}/`));

      if (isApiRequest && typeof user.token === 'string' && user.token.trim()) {
        headers = headers.set('Authorization', `Bearer ${user.token}`);
      }
    } catch {
      // Invalid persisted session data is handled by AuthService during session restoration.
    }
  }

  return next(req.clone({ headers }));
};
