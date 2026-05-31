# Feature Specification: Login-Gated Articles

**Feature Branch**: `001-login-gated-articles`

**Created**: 2026-05-30

**Status**: Draft (retroactive — documents work already shipped in commit `53e73bc`)

**Input**: User description: "Auth-gated SPA with login page and paginated articles. The app must require login on a dedicated login page before any article content is visible; on successful login the user lands on an articles page. The articles page lists articles paginated (5 per page) with previous/next navigation showing current page, total pages and total count, and each article exposes buttons to edit it, delete it, and add a comment. Unauthenticated visitors are redirected to the login page; already-authenticated visitors hitting the login page are redirected to the articles page; the session survives a page reload."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in before seeing content (Priority: P1)

A visitor opens the app and is presented with a dedicated login page. No article
content is visible until they authenticate. After entering valid credentials they
are taken to the articles page; with invalid credentials they stay on the login
page and see an error.

**Why this priority**: The gate is the entry point — without it nothing else in
the app is reachable, and it is the core behavior the user asked for ("require
login on a page first").

**Independent Test**: Visit the app while signed out → land on the login page with
no articles shown. Submit valid credentials → arrive on the articles page. Submit
invalid credentials → remain on login with a visible error message.

**Acceptance Scenarios**:

1. **Given** a signed-out visitor, **When** they open any app address, **Then** they see the login page and no article content.
2. **Given** the login page, **When** valid credentials are submitted, **Then** the visitor is taken to the articles page.
3. **Given** the login page, **When** invalid credentials are submitted, **Then** the visitor stays on the login page and sees an error message.
4. **Given** a signed-out visitor, **When** they try to open the articles page directly, **Then** they are redirected to the login page.
5. **Given** a signed-in user, **When** they navigate to the login page, **Then** they are redirected to the articles page.

---

### User Story 2 - Browse articles page by page (Priority: P2)

A signed-in user sees a list of articles shown a fixed number at a time (5), most
recent first, and can move forward and backward through the pages. The pager shows
the current page, the total number of pages, and the total number of articles.

**Why this priority**: Once inside, browsing the catalog is the primary read
activity. Pagination keeps the list usable as the catalog grows.

**Independent Test**: Sign in with more than 5 articles present → see exactly 5,
newest first, plus a pager reporting page 1 of N and the total count. Use Next /
Previous → the visible articles and the current-page indicator change accordingly;
Previous is disabled on the first page and Next on the last.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the articles page with more than 5 articles, **When** the page loads, **Then** at most 5 articles are shown, ordered newest first.
2. **Given** the pager, **When** the user selects Next, **Then** the next set of articles is shown and the current-page indicator advances.
3. **Given** the pager, **When** the user selects Previous, **Then** the previous set is shown and the indicator decreases.
4. **Given** the first page, **When** it is displayed, **Then** Previous is unavailable.
5. **Given** the last page, **When** it is displayed, **Then** Next is unavailable.
6. **Given** any page, **When** it is displayed, **Then** the total number of articles and total pages are visible.

---

### User Story 3 - Act on an article (edit, delete, comment) (Priority: P2)

From the articles list a signed-in user can edit an article, delete it, or add a
comment to it, with each article exposing the corresponding controls.

**Why this priority**: These are the management actions that make the page useful
beyond reading; they share the gated, paginated context of Story 2.

**Independent Test**: As a signed-in user, edit an article and see the change
reflected; delete an article and see it removed from the list; add a comment and
see it appear under the article.

**Acceptance Scenarios**:

1. **Given** an article in the list, **When** the user chooses Edit and saves changes, **Then** the updated article is reflected in the list.
2. **Given** an article in the list, **When** the user chooses Delete and confirms, **Then** the article is removed from the list.
3. **Given** an article, **When** the user submits a comment, **Then** the comment appears under that article attributed to the signed-in user.
4. **Given** the user deletes the only article remaining on a page beyond the first, **When** the deletion completes, **Then** the user is shown the previous page rather than an empty page.
5. **Given** the user creates a new article, **When** it is saved, **Then** the user is shown the page where the newest article appears (the first page).

---

### Edge Cases

- **Reload while signed in**: a page refresh keeps the user signed in and on the articles page; their identity is restored without re-entering credentials.
- **Stored session no longer valid**: if a remembered session is rejected on reload, the user is treated as signed out and sent to the login page.
- **Sign out**: signing out returns the user to the login page and prevents access to article content until they sign in again.
- **Empty catalog**: when there are no articles, the list area is empty and no pager is shown.
- **Single page of results**: when all articles fit on one page, no pager navigation is offered.
- **Empty comment**: submitting a blank comment does nothing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST present a dedicated login page and MUST NOT reveal any article content to a visitor who is not signed in.
- **FR-002**: The app MUST authenticate a visitor from submitted credentials and, on success, take them to the articles page.
- **FR-003**: On failed authentication the app MUST keep the visitor on the login page and show an error message.
- **FR-004**: The app MUST redirect a signed-out visitor who requests the articles page to the login page.
- **FR-005**: The app MUST redirect a signed-in user who requests the login page to the articles page.
- **FR-006**: The app MUST keep the user signed in across a page reload and restore their identity without re-prompting for credentials.
- **FR-007**: The app MUST treat a remembered session that is rejected as signed out.
- **FR-008**: The app MUST let a signed-in user sign out, after which article content is no longer accessible.
- **FR-009**: The articles page MUST show articles a fixed number at a time (5), ordered newest first.
- **FR-010**: The articles page MUST provide forward/backward navigation and MUST display the current page, the total number of pages, and the total number of articles.
- **FR-011**: Backward navigation MUST be unavailable on the first page and forward navigation MUST be unavailable on the last page.
- **FR-012**: Each listed article MUST expose controls to edit it, delete it, and add a comment.
- **FR-013**: Editing an article MUST reflect the saved changes in the list.
- **FR-014**: Deleting an article MUST require confirmation and MUST remove it from the list; if it was the last item on a page beyond the first, the previous page MUST be shown.
- **FR-015**: Creating an article MUST show the user the page where the newest article appears (the first page).
- **FR-016**: Adding a comment MUST attribute it to the signed-in user and display it under the target article; a blank comment MUST be ignored.

### Key Entities *(include if feature involves data)*

- **User**: the authenticated person; has an identity (name) used to attribute comments and shown while signed in.
- **Article**: a catalog item with a title, a slug, and content; belongs to a category and an author; has zero or more comments.
- **Category**: a named grouping selectable when creating or editing an article.
- **Comment**: text attached to an article, attributed to the user who wrote it.
- **Session**: the remembered sign-in that survives reloads until it is signed out or rejected.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of attempts to view article content while signed out result in the login page instead, with no article data exposed.
- **SC-002**: A user with valid credentials can sign in and reach the articles page in under 5 seconds and at most one form submission.
- **SC-003**: The articles page never shows more than 5 articles at once, and the user can reach any article in the catalog using forward/backward navigation.
- **SC-004**: The current page, total pages, and total article count shown by the pager always match the catalog.
- **SC-005**: After a page reload, a signed-in user remains signed in and on the articles page in at least 99% of reloads where the session is still valid.
- **SC-006**: Edit, delete, and comment actions each reflect their result in the list without requiring a manual full-page reload.

## Assumptions

- The login page reuses the existing credential-based authentication of the backing service; no new sign-up, password reset, or third-party sign-in is in scope.
- The fixed page size is 5 articles, matching the shipped behavior.
- Articles are ordered newest-first; no other sort or filter controls are in scope for this feature.
- Reading articles and their comments requires being signed in (the gate covers the whole article experience); finer-grained public/anonymous read access is out of scope here.
- The set of management actions is limited to edit, delete, and comment on existing articles plus creating a new one; bulk actions and category management are out of scope.
- The backing article service already supports paginated listing and exposes the current page, total pages, and total count.
