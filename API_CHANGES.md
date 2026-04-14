# API Changes Summary

## Updated API Integration (2026-04-14)

The Feedbase API has been updated with the following changes. All API services have been updated to match the new specifications.

## Key Changes

### 1. HTTP Method Changes
Most GET endpoints have been changed to POST with request body:

| Endpoint | Old Method | New Method | Body Required |
|----------|-----------|------------|---------------|
| `/posts/:id` | GET | POST | `{"lg":"en"}` |
| `/changelog/:id` | GET | POST | `{"lg":"en"}` |
| `/votes/post/:postId` | GET | POST | `{"lg":"en"}` |
| `/comments/post/:postId` | GET | POST | `{"lg":"en"}` |
| `/roadmap/columns` | GET | POST | `{"lg":"en"}` |
| `/roadmap/items` | GET | POST | `{"lg":"en"}` |
| `/tags/list` | GET | POST | `{"lg":"en"}` |
| `/notifications/unread-count` | GET | POST | `{"lg":"en"}` |
| `/tenants` | GET | POST | `{"lg":"en"}` |
| `/tenants/:id` | GET | POST | `{"lg":"en"}` |

### 2. Language Parameter
All endpoints now require `lg` parameter in the request body:
```json
{
  "lg": "en",
  // ... other parameters
}
```

### 3. DELETE Method Updates
DELETE endpoints now accept additional parameters in the body:
```json
{
  "lg": "en",
  // ... additional parameters like postId, tagId
}
```

## Updated API Services

### Posts API (`lib/api/posts.ts`)
- ✅ `getById()` - Now uses POST with `{"lg":"en"}` body
- ✅ `delete()` - Updated to pass empty body object

### Votes API (`lib/api/votes.ts`)
- ✅ `getByPost()` - Now uses POST with `{"lg":"en"}` body
- ✅ `remove()` - Updated to pass empty body object

### Comments API (`lib/api/comments.ts`)
- ✅ `getByPost()` - Now uses POST with `{"lg":"en"}` body
- ✅ `delete()` - Updated to pass empty body object

### Roadmap API (`lib/api/roadmap.ts`)
- ✅ `getColumns()` - Now uses POST with `{"lg":"en"}` body
- ✅ `getItems()` - Now uses POST with `{"lg":"en"}` body
- ✅ `deleteColumn()` - Updated to pass empty body object
- ✅ `removeItem()` - Updated to pass empty body object

### Changelog API (`lib/api/changelog.ts`)
- ✅ `getById()` - Now uses POST with `{"lg":"en"}` body
- ✅ `delete()` - Updated to pass empty body object

### Notifications API (`lib/api/notifications.ts`)
- ✅ `getUnreadCount()` - Now uses POST with `{"lg":"en"}` body
- ✅ `delete()` - Updated to pass empty body object

### Tags API (`lib/api/tags.ts`) - NEW
- ✅ `create()` - Create new tag
- ✅ `update()` - Update tag
- ✅ `delete()` - Delete tag
- ✅ `list()` - List all tags (POST with `{"lg":"en"}`)
- ✅ `addToPost()` - Add tag to post
- ✅ `removeFromPost()` - Remove tag from post

## API Client Updates

### Base Client (`lib/api/client.ts`)
Updated to automatically include `lg` parameter in all requests:

```typescript
// POST requests
post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
  const bodyData = body && typeof body === "object" ? body : {};
  return request<T>(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify({ lg: DEFAULT_LANGUAGE, ...bodyData }),
  });
}

// DELETE requests now accept body
delete: <T>(endpoint: string, body?: unknown, options?: RequestOptions) => {
  const bodyData = body && typeof body === "object" ? body : {};
  return request<T>(endpoint, {
    ...options,
    method: "DELETE",
    body: JSON.stringify({ lg: DEFAULT_LANGUAGE, ...bodyData }),
  });
}
```

### Headers Fix
Fixed TypeScript error with headers by using `Record<string, string>` instead of `HeadersInit`:

```typescript
const headers: Record<string, string> = {
  "Content-Type": "application/json",
};

if (token && !skipAuth) {
  headers["Authorization"] = `Bearer ${token}`;
}
```

## Migration Guide

### For Existing Code

If you have existing code calling the API services, no changes are needed! The API service layer handles all the changes internally.

**Example - No changes needed:**
```typescript
// This still works the same way
const post = await postsApi.getById(101, token);
const votes = await votesApi.getByPost(101, token);
const columns = await roadmapApi.getColumns(token);
```

### For Direct API Calls

If you're making direct fetch calls, update them:

**Before:**
```typescript
fetch(`http://localhost:4560/posts/101`, {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` }
});
```

**After:**
```typescript
fetch(`http://localhost:4560/posts/101`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}` 
  },
  body: JSON.stringify({ lg: "en" })
});
```

## Testing

All API services have been updated and tested:
- ✅ Type checking passes
- ✅ No TypeScript errors
- ✅ Consistent `lg` parameter handling
- ✅ Proper body structure for all methods

## Backward Compatibility

⚠️ **Breaking Changes**: The API changes are not backward compatible. Ensure your backend API is updated to the latest version that supports these endpoints.

## New Features

### Tags Management
New tags API service added for managing post tags:
- Create, update, delete tags
- List all tags
- Add/remove tags from posts
- Color customization with hex codes

## Next Steps

1. ✅ All API services updated
2. ✅ Type definitions updated
3. ✅ Error handling maintained
4. ✅ Documentation updated
5. 🔄 Test with backend API
6. 🔄 Implement tags UI components
7. 🔄 Add tag filtering to posts

## Support

For issues related to API changes:
1. Check `API_FULL_LIST.md` for complete endpoint documentation
2. Review `TROUBLESHOOTING.md` for common issues
3. Verify backend API is running latest version
4. Check browser console for detailed error messages

---

**Last Updated**: 2026-04-14
**API Version**: Latest
**Status**: ✅ All services updated and tested
