# Feedbase Full API List

## Base URL

`http://localhost:4560`

## Headers

- `Authorization: Bearer <jwt_token>` for protected routes
- `Content-Type: application/json` for JSON endpoints
- `Content-Type: multipart/form-data` for file upload

## Notes

- `lg` is required on routes using `languageValidator`.
- Several GET/DELETE/PATCH routes still read `lg` from request body.
- Success response shape is usually `{ status, message, data? }`.
- Login returns `user` instead of `data`; image upload returns `filePath`.
- File uploads are `multipart/form-data` with a single binary field (`upload_image` for the generic uploader, `file` for post attachments).
- **Auth roles:** tenant users are `owner` or `user` only. The platform **admin** is a separate identity (its own `admins` table + `/admin/*` routes), not a tenant role.
- **One device at a time:** on Free/Pro, a second login returns `409` (`already_logged_in_elsewhere`). Pass `userData.force: true` to sign out other devices and take over. Business allows multiple devices. `POST /users/logout` revokes the current session; a revoked token gets `401` "Session ended".
- Money/plan values: plan keys are `free` / `pro` / `business`; billing `interval` is `month` or `year` (yearly is 20% cheaper).

---

## 1) Tenant APIs

### POST /tenants/create
Sample Body:
```json
{"lg":"en","tenantData":{"name":"Acme Labs","slug":"acme-labs","subdomain":"acme","customDomain":"feedback.acme.test","planName":"pro","brandingLogoUrl":"https://cdn.example.com/acme/logo.png","brandingPrimaryColor":"#0A7CFF"}}
```
Sample Response:
```json
{"status":"success","message":"Tenant created successfully","data":{"id":1}}
```

### POST /tenants/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Tenant retrieved successfully","data":{"id":1,"name":"Acme Labs","slug":"acme-labs","subdomain":"acme","custom_domain":"feedback.acme.test","plan_name":"pro","branding_logo_url":"https://cdn.example.com/acme/logo.png","branding_primary_color":"#0A7CFF","is_active":1}}
```

### PUT /tenants/update/:id
**Owner-only, and only your own workspace** (`:id` must be the caller's `tenantId`, else `403`). `planName` is NOT accepted (plan is set only by Stripe / an admin comp); custom domains are not supported. Changing `subdomain` validates format + reserved words (`400 invalid_subdomain`) and uniqueness (`409 subdomain_taken`); `slug` is kept in sync with it.
Sample Body:
```json
{"lg":"en","tenantData":{"name":"Acme Corporation","subdomain":"acme","brandingLogoUrl":"https://cdn.example.com/acme/new-logo.png","isActive":1}}
```
Sample Response:
```json
{"status":"success","message":"Tenant updated successfully"}
```

### POST /tenants
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Tenants retrieved successfully","data":[{"id":1,"name":"Acme Labs","slug":"acme-labs","subdomain":"acme","plan_name":"pro","is_active":1}]}
```

### GET /tenants/me
Returns the tenant of the currently authenticated user. `lg` may be passed as a query param (`?lg=en`).
Sample Response:
```json
{"status":"success","message":"Tenant retrieved successfully","data":{"id":1,"name":"Acme Labs","slug":"acme-labs","subdomain":"acme","custom_domain":"feedback.acme.test","plan_name":"pro","branding_logo_url":"https://cdn.example.com/acme/logo.png","branding_primary_color":"#0A7CFF","is_active":1}}
```

---

## 2) User APIs

### POST /users/login
On Free/Pro plans a second concurrent login is refused with `409` (`already_logged_in_elsewhere`); add `"force": true` to `userData` to sign out other devices and take over.
Sample Body:
```json
{"lg":"en","userData":{"email":"owner@acme.test","password":"SecurePass123!","force":false}}
```
Sample Response:
```json
{"status":"success","message":"User logged in successfully","user":{"token":"eyJ...","id":1,"tenantId":1,"fullName":"Acme Owner","email":"owner@acme.test","role":"owner","imageUrl":"uploads/profile-images/image-1712901234567.jpeg"}}
```

### POST /users/logout
Revokes the current device session (so the account can sign in elsewhere). Best-effort — an already-dead session still reports success.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Logged out successfully"}
```

### POST /users/oauth/login
The frontend completes the provider handshake (Google/GitHub/Microsoft) and posts the verified identity here. The user is matched by an existing oauth link, then by email within the tenant; otherwise a new user is provisioned. Returns a JWT in the same shape as password login.
Sample Body:
```json
{"lg":"en","userData":{"provider":"google","providerUserId":"google-owner-001","email":"owner@acme.test","fullName":"Acme Owner","avatarUrl":"https://lh3.googleusercontent.com/a/abc","tenantId":1}}
```
Sample Response:
```json
{"status":"success","message":"OAuth login successful","user":{"token":"eyJ...","id":1,"tenantId":1,"fullName":"Acme Owner","email":"owner@acme.test","role":"owner","imageUrl":"https://lh3.googleusercontent.com/a/abc"}}
```

### POST /users/register
Sample Body:
```json
{"lg":"en","userData":{"fullName":"Jane Product","email":"jane@acme.test","contact":"+8801712345678","password":"SecurePass123!"}}
```
Sample Response:
```json
{"status":"success","message":"Sign up is successful"}
```

### POST /users/password/forgot
Unauthenticated. Request a password-reset link. **Always** returns success (no account enumeration); emails a 1-hour, single-use link only when the email matches an active account.
Sample Body:
```json
{"lg":"en","email":"jane@acme.test"}
```
Sample Response:
```json
{"status":"success","message":"If an account exists for that email, we've sent a reset link.","data":{"emailSent":true,"mailConfigured":true}}
```

### GET /users/password/reset/:token
Unauthenticated. Validate a reset token so the reset page can render. Needs `?lg=`. Returns a **masked** email on success, `404` when invalid/expired.
Sample Response:
```json
{"status":"success","message":"Success","data":{"email":"ja***@acme.test"}}
```

### POST /users/password/reset
Unauthenticated. Consume a token and set the new password on **all** `users` rows for the account email; revokes every device session.
Sample Body:
```json
{"lg":"en","token":"<raw-token-from-email-link>","password":"NewSecurePass123!"}
```
Sample Response:
```json
{"status":"success","message":"Your password has been reset. You can now sign in."}
```

### GET /users/personal-data
Sample Body:
```json
{}
```
Sample Response:
```json
{"status":"success","message":"Data fetched successfully","data":{"user_id":1,"tenant_id":1,"full_name":"Acme Owner","email":"owner@acme.test","contact_no":"+8801712345678","role":"owner","avatar_url":"uploads/profile-images/image-1712901234567.jpeg"}}
```

### POST /users/update
`userData` accepts `fullName`, `contact`, and an avatar (`avatarUrl` or `imageUrl`, both persisted to `avatar_url`).
Sample Body:
```json
{"lg":"en","userData":{"userId":1,"fullName":"Acme Owner Updated","contact":"+8801711111111","avatarUrl":"uploads/profile-images/image-1712901234567.jpeg"}}
```
Sample Response:
```json
{"status":"success","message":"Profile updated successfully"}
```

### PATCH /users/role/:userId
Actor must be the workspace `owner`; allowed target roles are `owner` / `user` only.
Sample Body:
```json
{"lg":"en","role":"user"}
```
Sample Response:
```json
{"status":"success","message":"User role updated successfully"}
```

### POST /users/table-data
Sample Body:
```json
{"paginationData":{"itemsPerPage":10,"currentPageNumber":0,"sortOrder":"desc","filterBy":""}}
```
Sample Response:
```json
{"status":"success","message":"User data fetched successfully","data":{"metadata":{"totalRows":124},"tableData":[{"user_id":1,"full_name":"Acme Owner","email":"owner@acme.test"}]}}
```

### POST /users/user-list
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"User data fetched successfully","data":[{"user_id":1,"full_name":"Acme Owner","email":"owner@acme.test"}]}
```

### POST /users/change-password
Sample Body:
```json
{"lg":"en","oldPassword":"SecurePass123!","newPassword":"NewSecurePass456!"}
```
Sample Response:
```json
{"status":"success","message":"Password updated successfully"}
```

### POST /users/account/deletion-summary
What deleting this account would destroy (for the confirmation dialog): owned workspaces are deleted; joined workspaces are retained (the account's posts/comments there become anonymous).
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Data fetched successfully","data":{"email":"owner@acme.test","ownedWorkspaces":[{"tenantId":1,"name":"Acme Labs"}],"memberWorkspaces":[{"tenantId":2,"name":"Beta Works"}]}}
```

### POST /users/account/delete
Permanently deletes the authenticated account after re-authenticating with the password. Owned workspaces (and their Stripe subscriptions) are deleted; memberships elsewhere are removed. Signs the user out afterward.
Sample Body:
```json
{"lg":"en","password":"SecurePass123!"}
```
Sample Response:
```json
{"status":"success","message":"Account deleted","data":{"deletedWorkspaces":1,"leftWorkspaces":1}}
```

### GET /users/workspaces
Lists every workspace the account (by email) belongs to, plus per-account limits. `lg` may be a query param. `role` is `owner` (owned) or `user` (joined). `limits.ownLimit`/`joinLimit` are `null` when unlimited.
Sample Response:
```json
{"status":"success","message":"Data fetched successfully","data":{"workspaces":[{"user_id":1,"role":"owner","tenant_id":1,"name":"Acme Labs","subdomain":"acme","branding_primary_color":"#c74959","current":true}],"limits":{"tier":"pro","ownedCount":1,"memberCount":1,"ownLimit":3,"joinLimit":3,"canCreate":true,"canJoin":true}}}
```

### GET /users/workspaces/check-subdomain
Live availability check for the create-workspace form. Query: `?subdomain=acme&lg=en`.
Sample Response:
```json
{"status":"success","message":"Data fetched successfully","data":{"valid":true,"available":false}}
```

### POST /users/workspaces/create
Creates a new workspace owned by the account (subject to the plan's `ownWorkspaces` cap → `402` when exceeded). Returns a fresh token scoped to the new workspace.
Sample Body:
```json
{"lg":"en","workspaceData":{"name":"New Product","subdomain":"newprod","website":"https://newprod.com"}}
```
Sample Response:
```json
{"status":"success","message":"Workspace created successfully","data":{"token":"eyJ...","user":{"id":9,"tenantId":3,"role":"owner","fullName":"Acme Owner","email":"owner@acme.test","imageUrl":null},"tenant":{"id":3,"name":"New Product","subdomain":"newprod"}}}
```

### POST /users/workspaces/switch
Switches the active workspace; returns a fresh token scoped to the target (the account must have a user row there).
Sample Body:
```json
{"lg":"en","tenantId":2}
```
Sample Response:
```json
{"status":"success","message":"Workspace switched successfully","data":{"token":"eyJ...","user":{"id":5,"tenantId":2,"role":"user","fullName":"Acme Owner","email":"owner@acme.test","imageUrl":null}}}
```

---

## 3) Post APIs

### POST /posts/create
Sample Body:
```json
{"lg":"en","postData":{"title":"Add dark mode","description":"Please add dark mode support for the dashboard.","postType":"feature_request","status":"open","priority":2}}
```
Sample Response:
```json
{"status":"success","message":"Post created successfully","data":{"id":101}}
```

### POST /posts/:id
`author_email` is only populated on Pro+ workspaces (the `contactSubmitter` capability) — `null` otherwise. `implemented_notified_at` is set once the submitter has been emailed that the feedback shipped. `attachments` lists any photos/videos.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Post retrieved successfully","data":{"id":101,"title":"Add dark mode","description":"Please add dark mode support for the dashboard.","post_type":"feature_request","status":"completed","priority":2,"is_pinned":1,"duplicate_of_post_id":null,"author_name":"Jane Product","author_email":"jane@acme.test","implemented_notified_at":"2026-07-15T14:09:17.000Z","vote_count":12,"comment_count":4,"has_voted":true,"tags":[{"id":1,"name":"ui","color_hex":"#3B82F6"}],"attachments":[{"id":11,"kind":"image","url":"uploads/attachments/att-1712-abcd.png","mime_type":"image/png","size_bytes":48213,"original_name":"screenshot.png"}]}}
```

### POST /posts/attachment
Uploads one photo/video to attach to a feedback post (Pro+ `attachments` capability; `402` on Free). `multipart/form-data` with a single `file` field. Returns the stored attachment; pass its `id` in `postData.attachmentIds` on `POST /posts/create`.
Sample Body (multipart/form-data):
```txt
file: <binary image or video>
lg: en
```
Sample Response:
```json
{"status":"success","message":"Attachment uploaded","data":{"id":11,"kind":"image","url":"uploads/attachments/att-1712-abcd.png","mime_type":"image/png","size_bytes":48213}}
```

### PUT /posts/update/:id
Sample Body:
```json
{"lg":"en","postData":{"title":"Add dark mode support","description":"Please add dark mode and theme persistence.","postType":"feature_request","priority":1}}
```
Sample Response:
```json
{"status":"success","message":"Post updated successfully"}
```

### DELETE /posts/delete/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Post deleted successfully"}
```

### POST /posts/list
Supported `filters`: `status`, `postType`, `tagId`, `isPinned`, and `search` (full-text-ish match on title/description). `search` may also be passed as `paginationData.filterBy` (legacy). Pinned posts are returned first. Each post includes its `tags` array, `has_voted` (for the current user), and `is_pinned`. `total` respects the active filters.
Sample Body:
```json
{"lg":"en","paginationData":{"itemsPerPage":10,"currentPageNumber":0,"sortOrder":"desc","filterBy":""},"filters":{"status":"open","postType":"feature_request","tagId":1,"search":"dark mode"}}
```
Sample Response:
```json
{"status":"success","message":"Posts retrieved successfully","data":{"posts":[{"id":101,"title":"Add dark mode","post_type":"feature_request","status":"open","priority":2,"is_pinned":1,"duplicate_of_post_id":null,"author_name":"Jane Product","vote_count":12,"has_voted":true,"tags":[{"id":1,"name":"ui","color_hex":"#3B82F6"}]}],"total":38}}
```

### PATCH /posts/status/:id
`newStatus` is one of `open` / `planned` / `in_progress` / `completed` / `rejected` (validated). `rejected` = declined feedback (shown in the dashboard "All" + "Rejected" tabs, hidden from the public portal); restore by setting it back to `open`.
Sample Body:
```json
{"lg":"en","newStatus":"in_progress"}
```
Sample Response:
```json
{"status":"success","message":"Post status updated successfully"}
```

### POST /posts/:id/notify-implemented
Emails the feedback submitter that their request is implemented (Pro+ `contactSubmitter`, owner-only). Requires the post to be `completed` and to have a submitter email. Records `posts.implemented_notified_at`. Errors: `402 plan_limit_contact_submitter`, `403 billing_forbidden`, `400 feedback_not_completed`, `400 no_submitter_email`.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"The submitter has been notified","data":{"emailSent":true}}
```

### PATCH /posts/pin/:id
Pins or unpins a post. Omit `isPinned` to toggle the current value.
Sample Body:
```json
{"lg":"en","isPinned":true}
```
Sample Response:
```json
{"status":"success","message":"Post pinned successfully","data":{"id":101,"isPinned":true}}
```

### PATCH /posts/duplicate/:id
Marks a post as a duplicate of another post, or clears the mark when `duplicateOfPostId` is `null`. The target must exist in the same tenant and cannot be the post itself.
Sample Body:
```json
{"lg":"en","duplicateOfPostId":1}
```
Sample Response:
```json
{"status":"success","message":"Post marked as duplicate successfully"}
```

### POST /posts/:id/duplicate-suggestions
Suggests possible duplicate posts by matching significant title keywords within the tenant. Excludes the post itself and posts already flagged as duplicates.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Duplicate suggestions retrieved successfully","data":[{"id":4,"title":"Dark mode toggle missing","status":"open","post_type":"feedback","created_at":"2026-04-10T09:00:00.000Z","vote_count":3}]}
```

---

## 4) Vote APIs

> Voting is **public-board-only** — a workspace's own owner/team cannot upvote (votes measure demand among a workspace's users). The authenticated `POST /votes/add` and `DELETE /votes/remove/:postId` were **removed**; `/votes` is read-only. Visitors vote via `POST /public/:subdomain/posts/:postId/vote` (see Public APIs).

### POST /votes/post/:postId
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Votes retrieved successfully","data":[{"id":301,"post_id":101,"user_id":3,"vote_type":"upvote","full_name":"Jane Product","email":"jane@acme.test"}]}
```

---

## 5) Comment APIs

### POST /comments/create
Sample Body:
```json
{"lg":"en","commentData":{"postId":101,"body":"Great request. We need this soon.","parentCommentId":null}}
```
Sample Response:
```json
{"status":"success","message":"Comment created successfully","data":{"id":401}}
```

### PUT /comments/update/:id
Sample Body:
```json
{"lg":"en","body":"Updated comment text"}
```
Sample Response:
```json
{"status":"success","message":"Comment updated successfully"}
```

### DELETE /comments/delete/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Comment deleted successfully"}
```

### POST /comments/post/:postId
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Comments retrieved successfully","data":[{"id":401,"post_id":101,"author_id":3,"body":"Great request. We need this soon.","is_edited":0,"author_name":"Jane Product","author_email":"jane@acme.test"}]}
```

---

## 6) Tag APIs

### POST /tags/create
Sample Body:
```json
{"lg":"en","tagData":{"name":"ui","colorHex":"#3B82F6"}}
```
Sample Response:
```json
{"status":"success","message":"Tag created successfully","data":{"id":501}}
```

### PUT /tags/update/:id
Sample Body:
```json
{"lg":"en","tagData":{"name":"ux","colorHex":"#2563EB"}}
```
Sample Response:
```json
{"status":"success","message":"Tag updated successfully"}
```

### DELETE /tags/delete/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Tag deleted successfully"}
```

### POST /tags/list
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Tags retrieved successfully","data":[{"id":501,"name":"ui","color_hex":"#3B82F6"}]}
```

### POST /tags/add-to-post
Sample Body:
```json
{"lg":"en","postId":101,"tagId":501}
```
Sample Response:
```json
{"status":"success","message":"Tag added to post successfully"}
```

### DELETE /tags/remove-from-post
Sample Body:
```json
{"lg":"en","postId":101,"tagId":501}
```
Sample Response:
```json
{"status":"success","message":"Tag removed from post successfully"}
```

---

## 7) Roadmap APIs

### POST /roadmap/column/create
Sample Body:
```json
{"lg":"en","columnData":{"name":"In Progress","columnKey":"in_progress","sortOrder":2}}
```
Sample Response:
```json
{"status":"success","message":"Roadmap column created successfully","data":{"id":601}}
```

### PUT /roadmap/column/update/:id
Sample Body:
```json
{"lg":"en","columnData":{"name":"Planned","sortOrder":1}}
```
Sample Response:
```json
{"status":"success","message":"Roadmap column updated successfully"}
```

### DELETE /roadmap/column/delete/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Roadmap column deleted successfully"}
```

### POST /roadmap/columns
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Roadmap columns retrieved successfully","data":[{"id":601,"name":"Planned","column_key":"planned","sort_order":1}]}
```

### POST /roadmap/item/add
Sample Body:
```json
{"lg":"en","itemData":{"postId":101,"roadmapColumnId":601,"sortOrder":1,"targetReleaseDate":"2026-06-01"}}
```
Sample Response:
```json
{"status":"success","message":"Roadmap item added successfully","data":{"id":701}}
```

### PUT /roadmap/item/update/:id
Sample Body:
```json
{"lg":"en","itemData":{"roadmapColumnId":602,"sortOrder":1,"targetReleaseDate":"2026-06-15"}}
```
Sample Response:
```json
{"status":"success","message":"Roadmap item updated successfully"}
```

### DELETE /roadmap/item/remove/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Roadmap item removed successfully"}
```

### POST /roadmap/items
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Roadmap items retrieved successfully","data":[{"id":701,"post_id":101,"roadmap_column_id":601,"sort_order":1,"target_release_date":"2026-06-01","title":"Add dark mode","column_name":"Planned"}]}
```

---

## 8) Changelog APIs

### POST /changelog/create
Sample Body:
```json
{"lg":"en","changelogData":{"title":"April 2026 Update","summary":"Dark mode planning and bug fixes","content":"## New Features\n- Dark mode planning"}}
```
Sample Response:
```json
{"status":"success","message":"Changelog created successfully","data":{"id":801}}
```

### PUT /changelog/update/:id
Sample Body:
```json
{"lg":"en","changelogData":{"title":"April 2026 Update (Edited)","summary":"Dark mode planning and UX improvements","content":"Updated markdown content"}}
```
Sample Response:
```json
{"status":"success","message":"Changelog updated successfully"}
```

### DELETE /changelog/delete/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Changelog deleted successfully"}
```

### POST /changelog/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Changelog retrieved successfully","data":{"id":801,"title":"April 2026 Update","summary":"Dark mode planning and bug fixes","content":"## New Features\n- Dark mode planning","is_published":1,"created_by_name":"Acme Owner"}}
```

### POST /changelog/list
Sample Body:
```json
{"lg":"en","paginationData":{"itemsPerPage":10,"currentPageNumber":0,"sortOrder":"desc","filterBy":""}}
```
Sample Response:
```json
{"status":"success","message":"Changelogs retrieved successfully","data":{"changelogs":[{"id":801,"title":"April 2026 Update","summary":"Dark mode planning and bug fixes","is_published":1,"created_by_name":"Acme Owner"}],"total":12}}
```

### PATCH /changelog/publish/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Changelog published successfully"}
```

---

## 9) Notification APIs

### POST /notifications/list
Sample Body:
```json
{"lg":"en","paginationData":{"itemsPerPage":20,"currentPageNumber":0,"sortOrder":"desc","filterBy":""}}
```
Each notification includes `reference_type` and `reference_id` for deep-linking to the related post/comment/changelog.
Sample Response:
```json
{"status":"success","message":"Notifications retrieved successfully","data":{"notifications":[{"id":901,"notification_type":"post_status","title":"Post moved to planned","message":"Add dark mode is now planned.","reference_type":"post","reference_id":1,"is_read":0}],"total":4}}
```

### PATCH /notifications/mark-read/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Notification marked as read"}
```

### PATCH /notifications/mark-all-read
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"All notifications marked as read"}
```

### DELETE /notifications/delete/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Notification deleted successfully"}
```

### DELETE /notifications/clear
Delete ALL of the authenticated user's notifications at once.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"All notifications cleared","data":{"deleted":12}}
```

### POST /notifications/unread-count
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Unread count retrieved successfully","data":{"unreadCount":3}}
```

---

## 10) API Key APIs

### POST /api-keys/create
Sample Body:
```json
{"lg":"en","apiKeyData":{"keyName":"Production API Key","scopes":["read:posts","write:posts","read:analytics"],"expiresAt":"2027-04-12 00:00:00"}}
```
Sample Response:
```json
{"status":"success","message":"API key created successfully","data":{"id":1001,"key":"fb_7f6312f2c6f8b8f6f9f86a7f0d7c8a8c4d9b1e0ff5f8c1234567890abcd"}}
```

### PUT /api-keys/update/:id
Sample Body:
```json
{"lg":"en","apiKeyData":{"keyName":"Readonly Widget Key","scopes":["read:posts"]}}
```
Sample Response:
```json
{"status":"success","message":"API key updated successfully"}
```

### PATCH /api-keys/revoke/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"API key revoked successfully"}
```

### POST /api-keys/list
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"API keys retrieved successfully","data":[{"id":1001,"key_name":"Production API Key","key_prefix":"fb_7f6312","scopes":"[\"read:posts\",\"write:posts\"]","last_used_at":"2026-04-12T10:00:00.000Z","expires_at":"2027-04-12T00:00:00.000Z","is_revoked":0}]}
```

---

## 11) Audit Log APIs

### POST /audit-logs/list
Sample Body:
```json
{"lg":"en","paginationData":{"itemsPerPage":20,"currentPageNumber":0,"sortOrder":"desc","filterBy":""},"filters":{"action":"POST_CREATED","entityType":"post"}}
```
Sample Response:
```json
{"status":"success","message":"Audit logs retrieved successfully","data":{"logs":[{"id":1101,"action":"POST_CREATED","entity_type":"post","entity_id":101,"metadata":"{\"title\":\"Add dark mode\"}","actor_name":"Acme Owner"}],"total":97}}
```

### POST /audit-logs/create
Sample Body:
```json
{"lg":"en","logData":{"action":"POST_CREATED","entityType":"post","entityId":101,"metadata":{"title":"Add dark mode"},"ipAddress":"127.0.0.1","userAgent":"Mozilla/5.0"}}
```
Sample Response:
```json
{"status":"success","message":"Audit log created successfully"}
```

---

## 12) Integration APIs

### POST /integrations/create
Sample Body:
```json
{"lg":"en","integrationData":{"integrationType":"slack","config":{"webhookUrl":"https://hooks.slack.com/services/T000/B000/XXX","channel":"#product-feedback"}}}
```
Sample Response:
```json
{"status":"success","message":"Integration created successfully","data":{"id":1201}}
```

### PUT /integrations/update/:id
Sample Body:
```json
{"lg":"en","integrationData":{"config":{"webhookUrl":"https://hooks.slack.com/services/T000/B000/UPDATED","channel":"#feedback-updates"}}}
```
Sample Response:
```json
{"status":"success","message":"Integration updated successfully"}
```

### DELETE /integrations/delete/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Integration deleted successfully"}
```

### POST /integrations/list
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Integrations retrieved successfully","data":[{"id":1201,"integration_type":"slack","config":"{\"webhookUrl\":\"https://hooks.slack.com/services/T000/B000/XXX\",\"channel\":\"#product-feedback\"}","is_active":1}]}
```

### PATCH /integrations/toggle/:id
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Integration toggled successfully"}
```

---

## 13) File Upload API

### POST /uploader/upload-image
Sample Body (multipart/form-data):
```txt
upload_image: <binary image>
lg: en
```
Sample Response:
```json
{"status":"success","message":"Image uploaded successfully","filePath":"uploads/profile-images/image-1712901234567.jpeg"}
```

---

## 14) Analytics API

### POST /analytics/overview
Aggregate dashboard metrics for the current tenant: totals, status/type breakdowns, and a daily posts trend for the last 30 days.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Analytics retrieved successfully","data":{"totals":{"totalPosts":38,"pinnedPosts":2,"totalVotes":156,"totalComments":74,"totalUsers":12},"statusCounts":{"open":18,"planned":6,"in_progress":5,"completed":7,"closed":2},"typeCounts":{"feedback":12,"feature_request":20,"bug_report":6},"trends":[{"date":"2026-06-01","count":3},{"date":"2026-06-02","count":5}]}}
```

---

## 15) Billing APIs

Owner-only (Stripe hosted Checkout + Customer Portal — no card data touches this API).

### POST /billing/status
Reconciles from Stripe, then returns the current subscription state + the plan's enforced limits (and any active promotional offers).
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Billing status retrieved","data":{"planName":"pro","subscriptionStatus":"active","billingInterval":"year","currentPeriodEnd":"2027-07-15T00:00:00.000Z","hasSubscription":true,"limits":{"seats":5,"ownWorkspaces":3,"joinWorkspaces":3,"customDomain":true,"integrations":true,"deleteFeedback":true,"attachments":true,"contactSubmitter":true,"multiDevice":false},"offers":{}}}
```

### POST /billing/checkout
Starts a Stripe Checkout session for a paid plan and returns its hosted URL. `interval` is `month` (default) or `year` (~20% cheaper). An optional `promotionCode` (from a redeemed percent-off promo) is applied as a discount.
Sample Body:
```json
{"lg":"en","plan":"pro","interval":"year","promotionCode":"promo_1AbC..."}
```
Sample Response:
```json
{"status":"success","message":"Checkout session created","data":{"url":"https://checkout.stripe.com/c/pay/cs_test_..."}}
```

### POST /billing/redeem
Redeems a promo code (owner-only). A free-plan code comps the plan instantly; a percent-off code returns a Stripe `promotionCode` to pass into the next checkout.
Sample Body:
```json
{"lg":"en","code":"LAUNCH50"}
```
Sample Response:
```json
{"status":"success","message":"Promo code applied","data":{"type":"percent_off","percentOff":50,"appliesToPlan":"pro","promotionCode":"promo_1AbC..."}}
```

### POST /billing/portal
Returns a Stripe Billing Portal URL for the subscriber to change tier / update card / cancel.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Billing portal session created","data":{"url":"https://billing.stripe.com/p/session/..."}}
```

---

## 16) Invitation APIs

Owner-only (mounted at `/invitations`). The emailed link is single-use and expires in 7 days.

### POST /invitations
Invite a teammate by email. The address is validated (format + DNS MX). Over the plan's seat cap returns `402` (`plan_limit_seats`).
Sample Body:
```json
{"lg":"en","email":"newmate@acme.test"}
```
Sample Response:
```json
{"status":"success","message":"Invitation sent","data":{"id":21,"email":"newmate@acme.test","emailSent":true}}
```

### POST /invitations/list
List the workspace's pending/accepted invitations.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Invitations retrieved successfully","data":{"rows":[{"id":21,"email":"newmate@acme.test","status":"pending","expires_at":"2026-07-22T00:00:00.000Z"}]}}
```

### DELETE /invitations/:id
Revoke a pending invitation (kills its link immediately).
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Invitation revoked"}
```

### POST /invitations/:token/accept
Accept as an EXISTING, signed-in account (the session email must match the invited email). Over the account's join cap returns `402` (`plan_limit_workspaces_join`). Returns a fresh token scoped to the joined workspace.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Invitation accepted","data":{"token":"eyJ...","user":{"id":9,"tenantId":2,"role":"user","fullName":"New Mate","email":"newmate@acme.test","imageUrl":null},"tenant":{"id":2,"name":"Beta Works"}}}
```

---

## 17) Public / Portal APIs

Unauthenticated, mounted at `/public`. The tenant is resolved from the `:subdomain` param (matches `subdomain` OR `custom_domain`). Comment/feedback/vote routes use optional auth: a Bearer token attributes the action to that user, otherwise it's a guest (identified by `guestId`). Rejected posts and author emails are never exposed here.

### GET /public/tenant
Resolve a tenant by subdomain (or `?domain=`) for the portal. `attachments_enabled` reflects whether the workspace's plan allows attachments. Query: `?subdomain=acme&lg=en`.
Sample Response:
```json
{"status":"success","message":"Tenant retrieved successfully","data":{"id":1,"name":"Acme Labs","subdomain":"acme","custom_domain":null,"branding_logo_url":null,"branding_primary_color":"#c74959","attachments_enabled":true}}
```

### GET /public/offers
Active promotional offers, keyed by **plan then interval** (`offers[plan].month|.year`) — list-price strikethrough on the public pricing page. A monthly offer discounts the monthly price; a yearly offer discounts the yearly total. Query: `?lg=en`.
Sample Response:
```json
{"status":"success","data":{"pro":{"month":{"id":3,"plan":"pro","interval":"month","originalPrice":10,"offerPrice":7.5,"percentOff":25,"label":"Launch offer","endsAt":"2026-08-01T23:59:59.000Z"},"year":{"id":4,"plan":"pro","interval":"year","originalPrice":96,"offerPrice":80,"percentOff":17,"label":null,"endsAt":null}}}}
```

### GET /public/invitations/:token
Describe an invitation so the accept page can render (workspace name, invited email, validity).
Sample Response:
```json
{"status":"success","message":"Invitation retrieved successfully","data":{"email":"newmate@acme.test","workspaceName":"Acme Labs","valid":true}}
```

### POST /public/invitations/:token/accept
Accept as a NEW person (sets name + password, signs them in).
Sample Body:
```json
{"lg":"en","fullName":"New Mate","password":"SecurePass123!"}
```
Sample Response:
```json
{"status":"success","message":"Invitation accepted","data":{"token":"eyJ...","user":{"id":10,"tenantId":1,"role":"user","fullName":"New Mate","email":"newmate@acme.test","imageUrl":null},"tenant":{"id":1,"name":"Acme Labs"}}}
```

### POST /public/:subdomain/posts
Public feedback board (read). Supports `filters` (`status`, `postType`, `tagId`, `search`) and `paginationData`. Board cards include `attachment_count` + a `thumbnail_path`.
Sample Body:
```json
{"lg":"en","paginationData":{"itemsPerPage":20,"currentPageNumber":0,"sortOrder":"desc","filterBy":""},"filters":{"status":"planned"}}
```
Sample Response:
```json
{"status":"success","message":"Board retrieved successfully","data":{"posts":[{"id":101,"title":"Add dark mode","post_type":"feature_request","status":"planned","vote_count":12,"comment_count":4,"attachment_count":1,"thumbnail_path":"uploads/attachments/att-1712-abcd.png"}],"total":18}}
```

### POST /public/:subdomain/posts/:postId
Public post detail with its comment thread (no author emails).
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Post retrieved successfully","data":{"id":101,"title":"Add dark mode","description":"...","post_type":"feature_request","status":"planned","vote_count":12,"comment_count":4,"author_name":"Brave Otter","guest_id":"fb_guest_ab12","tags":[],"comments":[{"id":401,"body":"Yes please!","author_name":"Kind Fox","guest_id":"fb_guest_cd34"}]}}
```

### POST /public/:subdomain/feedback
Submit feedback (guest or logged-in). A guest MUST include `submitterEmail` (so the team can follow up); logged-in submitters are attributed via their Bearer token. `attachmentIds` link previously-uploaded attachments (paid workspaces).
Sample Body:
```json
{"lg":"en","title":"Add dark mode","description":"Please add it","postType":"feature_request","submitterName":"Dana","submitterEmail":"dana@example.com","guestId":"fb_guest_ab12","attachmentIds":[11]}
```
Sample Response:
```json
{"status":"success","message":"Post created successfully","data":{"id":102}}
```

### POST /public/:subdomain/attachments
Upload a photo/video from the public board (only when the workspace's plan allows attachments; `402` otherwise). `multipart/form-data` with a `file` field. Returns an attachment `id` to pass in the feedback body's `attachmentIds`.
Sample Body (multipart/form-data):
```txt
file: <binary image or video>
lg: en
```
Sample Response:
```json
{"status":"success","message":"Attachment uploaded","data":{"id":12,"kind":"video","url":"uploads/attachments/att-1712-efgh.mp4","mime_type":"video/mp4","size_bytes":4210233}}
```

### POST /public/:subdomain/posts/:postId/vote
Toggle an upvote. Anonymous identity comes from `guestId` (a persistent per-browser id), or the Bearer token when logged in.
Sample Body:
```json
{"lg":"en","guestId":"fb_guest_ab12"}
```
Sample Response:
```json
{"status":"success","message":"Vote updated","data":{"voted":true,"vote_count":13}}
```

### POST /public/:subdomain/posts/:postId/comments
Add a comment (or a threaded reply via `parentCommentId`). Guest or logged-in (Bearer).
Sample Body:
```json
{"lg":"en","body":"Great idea","parentCommentId":null,"submitterName":"Dana","submitterEmail":"dana@example.com","guestId":"fb_guest_ab12"}
```
Sample Response:
```json
{"status":"success","message":"Comment created successfully","data":{"id":402}}
```

### PUT /public/:subdomain/posts/:postId · DELETE /public/:subdomain/posts/:postId
Edit / delete YOUR OWN post — login required (Bearer); rejected unless `author_id === your id` (`not_your_content`).
Sample Body (PUT):
```json
{"lg":"en","title":"Add dark mode (updated)","description":"..."}
```
Sample Response:
```json
{"status":"success","message":"Post updated successfully"}
```

### PUT /public/:subdomain/comments/:commentId · DELETE /public/:subdomain/comments/:commentId
Edit / delete YOUR OWN comment — login required (Bearer), same ownership rule.
Sample Response:
```json
{"status":"success","message":"Comment updated successfully"}
```

### POST /public/:subdomain/roadmap
Public roadmap (columns + their items). Read-only.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Roadmap retrieved successfully","data":{"columns":[{"id":601,"name":"Planned","column_key":"planned","items":[{"post_id":101,"title":"Add dark mode","vote_count":12}]}]}}
```

### POST /public/:subdomain/changelog · POST /public/:subdomain/changelog/:changelogId
Public changelog list / single published entry.
Sample Body:
```json
{"lg":"en","paginationData":{"itemsPerPage":10,"currentPageNumber":0,"sortOrder":"desc","filterBy":""}}
```
Sample Response:
```json
{"status":"success","message":"Changelog retrieved successfully","data":{"changelogs":[{"id":801,"title":"July 2026 Update","summary":"...","created_at":"2026-07-01T00:00:00.000Z"}],"total":12}}
```

---

## 18) Admin (Platform) APIs

Mounted at `/admin`. All routes except `/admin/auth/login` require an **admin** Bearer token (issued by `/admin/auth/login`; a JWT with `scope:'admin'`), distinct from tenant user tokens. Admins are a separate `admins` table.

### POST /admin/auth/login
Sample Body:
```json
{"lg":"en","userData":{"email":"admin@feedbase.app","password":"Test123!"}}
```
Sample Response:
```json
{"status":"success","message":"Admin logged in successfully","admin":{"token":"eyJ...","id":1,"fullName":"Platform Admin","email":"admin@feedbase.app"}}
```

### Remaining admin endpoints
All take `{ "lg": "en", ... }` bodies and return the standard `{ status, message, data? }` shape.

Platform overview:
- `GET  /admin/overview` — platform-wide counts (tenants, users, posts, active subscriptions, redemptions).

Workspaces (any tenant):
- `GET    /admin/workspaces` · `GET /admin/workspaces/:id` — list / detail (name, subdomain, owner email, plan, counts).
- `PUT    /admin/workspaces/:id` — update workspace fields.
- `PUT    /admin/workspaces/:id/plan` — grant / comp / revoke a plan. Body `{ plan, durationMonths? }`: `durationMonths` falsy/0 = lifetime comp, positive = expires after N months (reverts to Free). Cancels any live Stripe subscription first. Comped: no Stripe subscription.
- `DELETE /admin/workspaces/:id` — delete a workspace.
- `GET    /admin/workspaces/:id/posts` — list a workspace's posts (moderation view).
- `PUT    /admin/workspaces/:id/posts/:postId/status` · `.../pin` — moderate status (roadmap-synced) / pin.
- `DELETE /admin/workspaces/:id/posts/:postId` — delete a post.
- `GET    /admin/workspaces/:id/posts/:postId/comments` · `DELETE /admin/workspaces/:id/comments/:commentId` — view / delete comments (no editing).

Users (across tenants):
- `GET  /admin/users` — list/search.
- `PUT  /admin/users/:id` — update (name/role/active).
- `PUT  /admin/users/:id/password` — reset password.
- `DELETE /admin/users/:id` — delete.

Admins:
- `GET  /admin/admins` · `POST /admin/admins` — list / create (bcrypt).
- `PUT  /admin/admins/:id/active` — activate/deactivate (self-guarded).
- `DELETE /admin/admins/:id` — delete.

Promo codes:
- `GET  /admin/promo-codes` · `POST /admin/promo-codes` — list / generate (percent-off → Stripe coupon + promotion code; free-plan → app record).
- `PUT  /admin/promo-codes/:id/revoke` — deactivate.

Offers (promotional plan prices):
- `GET  /admin/offers` · `POST /admin/offers` — list / create. Body `{ plan, interval: "month"|"year", offerPrice, label?, startsAt?, endsAt? }`; `offerPrice` may be fractional and (for `year`) is the yearly total. One active offer per (plan, interval), backed by a fixed amount-off Stripe coupon.
- `PUT  /admin/offers/:id/deactivate` — deactivate (deletes its coupon).

Support chat (admin side of the user↔admin chat; see section 19):
- `GET  /admin/support/unread` — count of open sessions with unread user messages (sidebar badge).
- `GET  /admin/support/sessions?status=open|closed` — session queue with workspace/user, unread-from-user, and last message.
- `GET  /admin/support/sessions/:id` — one session + full transcript (marks user messages read).
- `POST /admin/support/sessions/:id/messages` — reply. Body `{ body }`. Rejected (`400`) on a closed session.
- `PUT  /admin/support/sessions/:id/close` — close a session (the user loses access; the admin keeps the transcript).

---

## 19) Support Chat (User) APIs

Mounted at `/support`, all behind a tenant user Bearer token (`authenticateToken`). Every user (any role/plan) may chat with the platform admin. Reads are scoped to the caller's **open** session — once the admin closes it, these return `403` and the session is invisible to the user. See the admin side in section 18.

### POST /support/session
Resume the caller's open session or create one (at most one open session per user).
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Support session ready","data":{"session":{"id":12,"status":"open","created_at":"2026-07-17T10:00:00.000Z","last_message_at":null}}}
```

### POST /support/messages/:sessionId/list
Messages in an open session the caller owns (marks admin replies read). `403` if closed/not theirs.
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Messages retrieved","data":{"messages":[{"id":1,"sender":"user","body":"Hi, I need help","created_at":"2026-07-17T10:00:05.000Z"},{"id":2,"sender":"admin","body":"Happy to help!","created_at":"2026-07-17T10:01:00.000Z"}]}}
```

### POST /support/messages/:sessionId
Post a message into the caller's open session.
Sample Body:
```json
{"lg":"en","body":"Thanks, that worked."}
```
Sample Response:
```json
{"status":"success","message":"Message sent"}
```

### POST /support/unread
Unread admin replies in the caller's open session (drives the floating badge).
Sample Body:
```json
{"lg":"en"}
```
Sample Response:
```json
{"status":"success","message":"Unread count retrieved","data":{"hasOpenSession":true,"sessionId":12,"unreadCount":1}}
```

---

## Enum Values

### Post Types
- `feedback`
- `feature_request`
- `bug_report`

### Post Status
- `open`
- `planned`
- `in_progress`
- `completed`
- `rejected` — declined feedback (dashboard "All" + "Rejected" tabs; hidden from the public portal)
- `closed` — legacy, not offered in the UI

### Tenant Roles
- `owner` — administers the workspace (team, billing, feedback deletion, submitter contact)
- `user` — a workspace member

The platform **admin** is NOT a tenant role — it's a separate identity in the `admins` table (see the Admin APIs).

### Plans
- `free` · `pro` · `business`

### Billing Interval
- `month` · `year` (yearly is 20% cheaper)

### Integration Types
- `slack`
- `discord`
- `webhook`
- `zapier`

### Notification Types
- `post_status`
- `comment_reply` — a new comment on a post (fanned out to the team)
- `mention`
- `changelog`
- `system`
- `new_feedback` — new feedback posted on the public board (fanned out to the team)
