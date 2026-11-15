# Admin API setup

Apply the Prisma migration and generate the client before starting the API:

```sh
npm run prisma:migrate
npm run prisma:generate
```

Set `AUTH_TOKEN_SECRET` to a secret value of at least 32 characters. For example,
generate one with `openssl rand -base64 32`. Login and registration responses
include a signed bearer token that is valid for 24 hours; send it as
`Authorization: Bearer <token>`. The API loads the user's current role from the
database for every authenticated request, so a client-supplied role is never
trusted. Existing and newly registered users default to `USER`. Promote an
authorized account to admin out of band, for example:

```sql
UPDATE "User" SET "role" = 'ADMIN' WHERE "email" = 'admin@example.com';
```

Admin routes are:

- `GET /admin/users`: returns public user identity fields and role only.
- `DELETE /admin/users/:userId`: returns `204` when deleted, `404` for an
  unknown account, and `409` when deleting the caller or an account with
  bookings/passenger records.
- `POST /admin/flights`: creates a flight using existing airport records. The
  submitted airport descriptions and duration are ignored; canonical airport
  data and duration are derived on the server. An existing airline record's
  name is canonical; an airline is created from the submitted name when its
  code is new. The current flight schema requires an aircraft, but the request
  does not carry one, so the API assigns the lowest-ID configured aircraft and
  returns `409` if none exists.

Run the backend build and endpoint tests with `npm test`.
