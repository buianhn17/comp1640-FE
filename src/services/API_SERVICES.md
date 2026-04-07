# Frontend API Services Documentation

This document provides an overview of all available API service modules in the frontend application and their corresponding backend REST APIs.

## Available Services

### 1. **authService.js**
Handles authentication operations.
- `login(data)` - POST `/auth/login`
- `register(data)` - POST `/auth/register`
- `logout()` - POST `/auth/logout`

### 2. **userService.js**
User management operations (Admin/HR Manager only).
- `getUsers(params)` - GET `/users` (with optional deptId filter)
- `getUserById(id)` - GET `/users/{id}`
- `createUser(payload)` - POST `/users`
- `updateUser(id, payload)` - PUT `/users/{id}`
- `deleteUser(id)` - DELETE `/users/{id}`
- `toggleUserActive(id)` - PATCH `/users/{id}/toggle-active`

### 3. **academicYearService.js**
Academic year management (Admin only for create/update/delete).
- `getAcademicYears()` - GET `/academic-years`
- `getAcademicYearById(id)` - GET `/academic-years/{id}`
- `getCurrentAcademicYear()` - GET `/academic-years/current`
- `createAcademicYear(payload)` - POST `/academic-years`
- `updateAcademicYear(id, payload)` - PUT `/academic-years/{id}`
- `deleteAcademicYear(id)` - DELETE `/academic-years/{id}`

### 4. **departmentService.js**
Department management (Admin only for create/update/delete).
- `getDepartments()` - GET `/departments`
- `getDepartmentById(id)` - GET `/departments/{id}`
- `createDepartment(payload)` - POST `/departments`
- `updateDepartment(id, payload)` - PUT `/departments/{id}`
- `deleteDepartment(id)` - DELETE `/departments/{id}`

### 5. **ideaService.js** ✨ NEW
Idea submission and management.
- `submitIdea(payload)` - POST `/ideas` - Submit new idea
- `getAllIdeas(params)` - GET `/ideas` - Get all ideas (with optional yearId, deptId, page, size filters)
- `getMostPopularIdeas(page, size)` - GET `/ideas/most-popular` - Get most popular ideas
- `getLatestIdeas(page, size)` - GET `/ideas/latest` - Get latest ideas
- `getMostViewedIdeas(yearId)` - GET `/ideas/most-viewed` - Get most viewed ideas by academic year
- `getIdeaById(id)` - GET `/ideas/{id}` - Get idea details (increments view count)
- `updateIdea(id, payload)` - PUT `/ideas/{id}` - Update idea (owner only)
- `deleteIdea(id)` - DELETE `/ideas/{id}` - Delete idea (owner or admin)

### 6. **commentService.js** ✨ NEW
Comment management on ideas.
- `addComment(ideaId, payload)` - POST `/ideas/{ideaId}/comments` - Add comment to idea
- `getCommentsByIdea(ideaId)` - GET `/ideas/{ideaId}/comments` - Get all comments for an idea
- `getLatestComments(page, size)` - GET `/comments/latest` - Get latest comments system-wide
- `updateComment(commentId, payload)` - PUT `/comments/{commentId}` - Update comment (author only)
- `deleteComment(commentId)` - DELETE `/comments/{commentId}` - Delete comment (author or admin)

### 7. **categoryService.js** ✨ NEW
Category management for ideas.
- `getCategories()` - GET `/categories` - Get all categories
- `getCategoryById(id)` - GET `/categories/{id}` - Get category details
- `createCategory(payload)` - POST `/categories` - Create category (ADMIN/QA_MGR only)
- `updateCategory(id, payload)` - PUT `/categories/{id}` - Update category (ADMIN/QA_MGR only)
- `deleteCategory(id)` - DELETE `/categories/{id}` - Delete category (ADMIN/QA_MGR only)

### 8. **documentService.js** ✨ NEW
File attachment management for ideas.
- `uploadDocument(ideaId, file)` - POST `/ideas/{ideaId}/documents` - Upload file attachment
- `getDocumentsByIdea(ideaId)` - GET `/ideas/{ideaId}/documents` - Get all attachments for idea
- `deleteDocument(ideaId, documentId)` - DELETE `/ideas/{ideaId}/documents/{documentId}` - Delete attachment

### 9. **voteService.js** ✨ NEW
Voting functionality on ideas.
- `voteOnIdea(ideaId, payload)` - POST `/ideas/{ideaId}/vote` - Vote on idea
- `getIdeaVotes(ideaId)` - GET `/ideas/{ideaId}/vote` - Get vote info for idea
- `deleteVote(ideaId)` - DELETE `/ideas/{ideaId}/vote` - Remove vote from idea

### 10. **reportService.js**
Reporting and export functionality (Manager/Admin only).
- `getStatisticsReport(yearId, deptId)` - GET `/reports/statistics` - Get statistics report
- `getIdeasWithoutComments(yearId)` - GET `/reports/no-comments` - Get ideas without comments
- `getAnonymousContent(yearId)` - GET `/reports/anonymous-content` - Get anonymous ideas/comments
- `exportToCSV(yearId)` - GET `/reports/export/csv` - Export to CSV file
- `exportAttachmentsAsZip(yearId)` - GET `/reports/export/attachments-zip` - Export files as ZIP

### 11. **apiClient.js**
Base Axios client configuration with interceptors.
- Automatically includes Bearer token from localStorage
- Base URL from VITE_API_URL environment variable
- Default Content-Type: application/json

## Usage Examples

### Ideas
```javascript
import { submitIdea, getLatestIdeas, getIdeaById } from '@/services/ideaService';

// Submit an idea
const newIdea = await submitIdea({
  title: 'My Idea',
  description: 'Description',
  categoryId: 1,
  isAnonymous: false
});

// Get latest ideas
const ideas = await getLatestIdeas(0, 10); // page 0, 10 items per page

// View idea details
const idea = await getIdeaById(1);
```

### Comments
```javascript
import { addComment, getCommentsByIdea } from '@/services/commentService';

// Add comment
const comment = await addComment(ideaId, {
  content: 'Great idea!',
  isAnonymous: false
});

// Get comments
const comments = await getCommentsByIdea(ideaId);
```

### File Upload
```javascript
import { uploadDocument, getDocumentsByIdea } from '@/services/documentService';

// Upload file
const doc = await uploadDocument(ideaId, fileInput.files[0]);

// Get files
const docs = await getDocumentsByIdea(ideaId);
```

### Voting
```javascript
import { voteOnIdea, getIdeaVotes } from '@/services/voteService';

// Vote
const result = await voteOnIdea(ideaId, { voteType: 'UPVOTE' });

// Get votes
const votes = await getIdeaVotes(ideaId);
```

## Authentication
All API requests automatically include the Bearer token from localStorage through the apiClient interceptor. The token is stored in `localStorage` as:
```javascript
{
  "auth": {
    "token": "jwt-token-here",
    "user": { /* user data */ }
  }
}
```

## Error Handling
All services throw errors on API failures. Wrap calls in try-catch blocks:
```javascript
try {
  const data = await getLatestIdeas();
} catch (error) {
  console.error('Failed to load ideas:', error);
  message.error('Failed to load ideas');
}
```

## Integration Status
✅ Already implemented and used:
- Authentication (login, register, logout)
- User management
- Academic year management
- Department management
- Report & export functionality

✨ Newly created services (ready to integrate):
- Idea management (submit, view, edit, delete)
- Comments (add, view, edit, delete)
- Categories (CRUD)
- Document uploads (upload, list, delete)
- Voting (vote, view, remove)

All services follow the same pattern and use the configured `apiClient` for consistent error handling and authentication.
