# Frontend UI Revamp Skill

## PURPOSE

This skill is ONLY for revamping the visual UI of an existing frontend.

The goal is to make the existing application look modern, premium, polished, consistent, and production-quality while preserving 100% of the existing functionality.

This skill MUST NOT be used to add features, redesign business logic, modify APIs, or change application behavior.

The existing application is the product.

The Design Recommendations are the visual reference.

The API document is the functional source of truth.

Your job is to visually transform the existing application without changing what it does.

============================================================
1. ABSOLUTE RULES
============================================================

These rules are mandatory.

RULE 1:
DO NOT add functionality.

RULE 2:
DO NOT remove functionality.

RULE 3:
DO NOT modify existing functionality.

RULE 4:
DO NOT modify backend code.

RULE 5:
DO NOT modify API endpoints.

RULE 6:
DO NOT modify API request or response contracts.

RULE 7:
DO NOT invent APIs.

RULE 8:
DO NOT invent data.

RULE 9:
DO NOT invent workflows.

RULE 10:
DO NOT add features because they appear in a design reference.

RULE 11:
DO NOT create a new product concept.

RULE 12:
DO NOT replace the existing application architecture.

RULE 13:
DO NOT replace the existing state management or data-fetching architecture merely for UI work.

RULE 14:
DO NOT change business rules.

RULE 15:
DO NOT change validation rules.

RULE 16:
DO NOT change authentication or authorization.

RULE 17:
DO NOT change checkout, payment, cart, order, product, inventory, customer, configuration, or integration behavior.

RULE 18:
DO NOT make unrelated refactors.

RULE 19:
DO NOT create a custom UI framework when the required frameworks already exist.

RULE 20:
DO NOT interpret "premium" as permission to invent functionality.

If something is not currently supported by the application or API documentation, DO NOT implement it.

============================================================
2. SOURCE OF TRUTH HIERARCHY
============================================================

Use the following priority order.

1. Existing application functionality
2. API document
3. Design Recommendations
4. This UI Revamp Skill
5. Task-specific user instructions

FUNCTIONALITY:

The existing application and API document determine WHAT the application does.

DESIGN:

The Design Recommendations determine HOW the application should look.

Do not reverse these priorities.

If the Design Recommendations show something that the application does not support:

DO NOT ADD IT.

If the existing application has functionality that is not visible in the design:

KEEP IT.

Redesign that existing functionality so that it visually fits the design.

============================================================
3. DESIGN RECOMMENDATIONS
============================================================

The project contains a Designs / Design Recommendations directory.

This directory contains visual design references for the application's screens.

Each screen may have an index.xaml or equivalent screen-specific design reference.

These files are visual references.

Before implementing any screen:

1. Identify the corresponding screen in the existing application.
2. Find its design reference.
3. Read the relevant index.xaml/design recommendation.
4. Understand the intended layout.
5. Understand typography.
6. Understand spacing.
7. Understand colors.
8. Understand component hierarchy.
9. Understand responsive behavior.
10. Implement that visual direction in the existing React application.

IMPORTANT:

index.xaml is a DESIGN REFERENCE.

It is NOT an implementation specification.

Do not copy functionality from it.

Do not assume that every element shown in index.xaml exists in the application.

Do not create new backend/API functionality based on index.xaml.

Use it only to understand the intended visual design.

============================================================
4. REQUIRED TECHNOLOGY STACK
============================================================

The redesigned frontend MUST use the following technologies.

CORE:

React
Vite
TypeScript

STYLING:

Tailwind CSS

UI COMPONENTS:

shadcn/ui

PRIMITIVES:

Radix UI where appropriate and where used by shadcn/ui components

ICONS:

Lucide React

ANIMATION:

Motion for React

These are REQUIRED.

Do not substitute them with another UI framework.

DO NOT introduce:

Material UI
MUI
Ant Design
Chakra UI
Mantine
Bootstrap
Semantic UI
PrimeReact
Another competing component library

unless the existing project already has a specific dependency that is required for an existing functionality and removing it would cause a functional regression.

Even in that case, do not use it as the primary visual design system for the redesign.

============================================================
5. VERIFY THE FRAMEWORKS BEFORE IMPLEMENTING
============================================================

Before changing UI code, inspect package.json and the existing frontend.

Verify whether these are already installed:

- tailwindcss
- shadcn/ui-related components
- radix-ui packages
- lucide-react
- motion

If a required framework is already installed:

USE IT.

Do not recreate its functionality manually.

If a required framework is missing:

Determine whether adding the dependency is necessary.

The required stack is:

Tailwind CSS
+
shadcn/ui
+
Radix UI
+
Lucide React
+
Motion

Do not silently replace a missing framework with custom CSS/components.

Do not create a custom component system to avoid using the required frameworks.

If dependency installation is required, keep it limited to the required frontend UI stack.

============================================================
6. IMPORTANT: DO NOT CREATE A NEW DESIGN SYSTEM FROM SCRATCH
============================================================

This is the most important design rule.

DO NOT do this:

"Let's invent a new design system for the application."

DO NOT create an unrelated design language such as:

- New product branding
- New visual identity
- New design philosophy
- New layout philosophy
- New color system unrelated to the reference
- New component language unrelated to the reference

Instead:

IMPLEMENT THE PROVIDED DESIGN.

You may create reusable design tokens if they are necessary to faithfully implement the Design Recommendations.

For example:

- colors
- spacing
- typography
- radius
- shadows

are acceptable when derived from the provided design.

But these tokens exist to IMPLEMENT the design.

They are not an excuse to invent a different design.

============================================================
7. DO NOT GENERATE DESIGN DOCUMENTS INSTEAD OF IMPLEMENTATION
============================================================

Do not spend the task creating documents describing:

- A new design system
- A new visual identity
- A new design philosophy
- A new component specification

unless explicitly requested.

The output of this skill is CODE.

The goal is:

Existing screen
    ↓
Design Recommendation
    ↓
Tailwind + shadcn + Radix + Lucide + Motion
    ↓
Improved existing screen

NOT:

Existing screen
    ↓
AI invents design system
    ↓
AI writes design specification
    ↓
AI implements something different

============================================================
8. SCREEN-BY-SCREEN PROCESS
============================================================

Work screen by screen.

For every screen:

STEP 1:

Inspect the existing implementation.

Identify:

- Route
- Components
- API calls
- Existing data
- Existing actions
- Existing forms
- Existing states
- Existing navigation
- Existing permissions

STEP 2:

Locate the matching Design Recommendation.

Read the relevant index.xaml/design reference.

STEP 3:

Create a mapping:

EXISTING FUNCTIONALITY
+
DESIGN REFERENCE
=
NEW VISUAL IMPLEMENTATION

STEP 4:

Implement the visual redesign.

STEP 5:

Verify that every existing action still works.

STEP 6:

Verify that API calls have not changed.

STEP 7:

Verify responsive behavior.

STEP 8:

Move to the next screen.

Do not redesign the entire application blindly in one pass.

============================================================
9. EXISTING FUNCTIONALITY MUST BE PRESERVED
============================================================

Before changing a screen, identify all existing functionality.

This includes:

- Buttons
- Links
- Forms
- Inputs
- Selects
- Dropdowns
- Tabs
- Search
- Filters
- Sorting
- Pagination
- Navigation
- Dialogs
- API calls
- Submit actions
- Delete actions
- Edit actions
- Create actions
- Status changes
- Uploads
- Image management
- Loading states
- Error states
- Success states
- Empty states

All must continue working.

The UI may change.

The behavior must not.

============================================================
10. API DOCUMENT IS THE FUNCTIONAL SOURCE OF TRUTH
============================================================

Use api-document for understanding available backend capabilities.

Do not invent API calls.

Do not modify API payloads.

Do not modify API responses.

Do not modify endpoints.

Do not add API functionality.

Do not add frontend functionality requiring an API that does not exist.

If a design reference contains functionality that is not represented by the API document and does not exist in the current application:

DO NOT IMPLEMENT IT.

============================================================
11. TAILWIND CSS
============================================================

Use Tailwind CSS for styling.

Prefer:

- Utility classes
- Responsive utilities
- Theme variables
- Semantic tokens
- Reusable class patterns

Avoid large amounts of arbitrary custom CSS.

Do not create huge CSS files to simulate what Tailwind can already do.

Do not hardcode random values throughout components.

Use the design reference to determine:

- spacing
- typography
- colors
- borders
- radius
- shadows
- sizing

============================================================
12. SHADCN/UI
============================================================

Use shadcn/ui for standard interface components where appropriate.

Examples:

- Button
- Input
- Select
- Dialog
- Sheet
- Dropdown Menu
- Popover
- Tabs
- Tooltip
- Alert Dialog
- Checkbox
- Radio Group
- Switch
- Form components

Do not manually recreate these components if the equivalent shadcn component exists.

Customize shadcn components using Tailwind to match the Design Recommendations.

Do not let the default shadcn appearance dictate the design.

The design reference remains the visual authority.

============================================================
13. RADIX UI
============================================================

Use Radix primitives through shadcn/ui where appropriate.

Prioritize:

- Accessibility
- Keyboard navigation
- Focus management
- Correct dialog behavior
- Correct popover behavior
- Correct dropdown behavior

Do not replace accessible primitives with custom JavaScript implementations.

============================================================
14. LUCIDE
============================================================

Use Lucide React for icons.

Do not use:

- Unicode symbols
- Random emoji icons
- Inline SVG icons copied from unrelated sources
- Multiple icon libraries unnecessarily

Keep icon sizing and stroke weight consistent.

============================================================
15. MOTION
============================================================

Use Motion for React for subtle, meaningful interactions.

Appropriate uses:

- Modal entrance/exit
- Sheet transitions
- Sidebar transitions
- Dropdown transitions
- Page transitions where appropriate
- Hover interactions
- Expand/collapse
- Small feedback animations

Do not animate everything.

Avoid:

- Excessive animation
- Slow transitions
- Bouncing UI
- Constant movement
- Decorative animations that reduce usability

The application should feel premium because of good design, not because everything moves.

============================================================
16. DESIGN QUALITY
============================================================

The target is:

MODERN
PREMIUM
CLEAN
PROFESSIONAL
CONSISTENT

Focus on:

- Typography hierarchy
- Visual hierarchy
- Spacing
- Alignment
- Component consistency
- Surface hierarchy
- Contrast
- Borders
- Shadows
- Button hierarchy
- Input hierarchy
- Table density
- Image treatment
- Empty states
- Loading states
- Error states
- Responsive behavior

Do not make the UI "premium" by adding:

- excessive gradients
- excessive glassmorphism
- excessive shadows
- huge rounded cards
- unnecessary animations
- oversized typography
- decorative elements
- fake metrics
- fake content

============================================================
17. RESPONSIVE DESIGN
============================================================

The redesigned UI must work on:

- Desktop
- Laptop
- Tablet
- Mobile

Do not simply scale down desktop.

Adapt layouts intentionally.

Examples:

Desktop:
Sidebar + content

Mobile:
Collapsible navigation + content

Desktop:
Multi-column form

Mobile:
Stacked form

Desktop:
Data table

Mobile:
Appropriate responsive table/card representation

Do not remove functionality on smaller screens.

============================================================
18. FORMS
============================================================

Improve visual quality of existing forms without changing behavior.

Improve:

- Labels
- Inputs
- Focus states
- Error states
- Required indicators
- Help text
- Section grouping
- Button hierarchy
- Loading states

Do not change:

- Required fields
- Validation rules
- API payloads
- Field semantics
- Business rules

============================================================
19. TABLES
============================================================

Redesign existing tables visually.

Improve:

- Header styling
- Row spacing
- Typography
- Status badges
- Action buttons
- Hover states
- Pagination
- Empty state
- Loading state
- Responsive behavior

Do not:

- Add columns
- Remove columns
- Add business data
- Change sorting
- Change filtering
- Change pagination

unless explicitly required by the existing implementation.

============================================================
20. CARDS
============================================================

Do not put everything inside cards.

Use cards only where the design reference indicates meaningful grouping.

Avoid:

Card inside card inside card.

Prefer:

Clear surfaces
+
Strong spacing
+
Minimal borders
+
Meaningful grouping

============================================================
21. COLORS AND TYPOGRAPHY
============================================================

Follow the Design Recommendations.

Do not invent a new palette because you personally prefer it.

Do not introduce random colors.

Use semantic colors for:

- Success
- Warning
- Error
- Information
- Primary
- Muted

Typography must follow the visual reference.

If a font is specified by the design reference and can be safely used, implement it.

Do not replace the application's typography with a random font.

============================================================
22. EMPTY / LOADING / ERROR STATES
============================================================

Existing states should be visually redesigned as part of the screen.

Do not invent new states.

Improve:

- Skeletons
- Loading indicators
- Empty states
- Error messages
- Retry UI

Preserve existing behavior.

============================================================
23. ACCESSIBILITY
============================================================

Preserve and improve accessibility.

Ensure:

- Keyboard navigation
- Visible focus states
- Semantic HTML
- Accessible labels
- Accessible dialogs
- Accessible dropdowns
- Sufficient contrast
- Touch-friendly targets

Use Radix/shadcn primitives wherever appropriate.

============================================================
24. DO NOT FIX UNRELATED BUGS
============================================================

If you discover an unrelated bug:

DO NOT fix it.

Record it in the final report.

This task is UI only.

Examples:

- Incorrect API response
- Backend bug
- Incorrect calculation
- Authentication bug
- Checkout bug
- Payment bug
- Inventory bug
- Database bug

Do not touch these.

============================================================
25. DO NOT CHANGE FUNCTIONAL STATE MANAGEMENT
============================================================

Preserve existing:

- React state
- Context
- Redux
- Zustand
- React Query
- API service layer
- Hooks
- Routing

unless a change is strictly required for the visual implementation.

Do not replace the application's architecture because another approach is fashionable.

============================================================
26. NO PLACEHOLDER FUNCTIONALITY
============================================================

Never add fake:

- Buttons
- Metrics
- Products
- Orders
- Users
- Charts
- Filters
- Actions
- Navigation items

A visual element must correspond to real existing functionality.

If a design reference has something that does not exist:

LEAVE IT OUT.

============================================================
27. DO NOT REMOVE EXISTING FUNCTIONALITY TO MATCH DESIGN
============================================================

If the current screen has an existing feature that is not represented in the design:

KEEP IT.

Adapt its visual appearance to the design.

The design reference is not permission to remove functionality.

============================================================
28. IMPLEMENTATION VALIDATION
============================================================

After each screen:

Verify:

- Existing route works.
- Existing API calls remain unchanged.
- Existing buttons work.
- Existing forms work.
- Existing navigation works.
- Existing validation works.
- Existing permissions work.
- Existing loading behavior works.
- Existing error behavior works.
- Existing success behavior works.

Then verify visual quality against the Design Recommendation.

============================================================
29. BUILD AND TEST
============================================================

After the redesign:

Run the existing frontend build.

Run the existing frontend tests if available.

Fix only issues caused by the UI implementation.

Do not modify unrelated functionality to make tests pass.

============================================================
30. FINAL REPORT
============================================================

At the end report:

1. Screens redesigned.
2. Design Recommendation files referenced.
3. shadcn/ui components used.
4. Radix components/primitives used.
5. Tailwind usage.
6. Lucide usage.
7. Motion usage.
8. Reusable UI components created.
9. Responsive improvements.
10. Existing functionality verified.
11. Build result.
12. Test result.
13. Any unrelated issues discovered but intentionally left untouched.

============================================================
31. FINAL NON-NEGOTIABLE RULE
============================================================

DO NOT IMPROVISE.

DO NOT INVENT.

DO NOT ADD.

DO NOT REMOVE.

DO NOT CHANGE FUNCTIONALITY.

DO NOT CREATE A DIFFERENT DESIGN THAN THE PROVIDED DESIGN RECOMMENDATIONS.

DO NOT CREATE A CUSTOM UI FRAMEWORK.

DO NOT REPLACE THE REQUIRED FRAMEWORKS.

USE:

React
+
Vite
+
TypeScript
+
Tailwind CSS
+
shadcn/ui
+
Radix UI
+
Lucide React
+
Motion for React

The Designs / Design Recommendations folder tells you what the UI should look like.

The existing application tells you what functionality exists.

The API document tells you what backend functionality exists.

Your job is to make the EXISTING APPLICATION look like the PROVIDED DESIGN using the REQUIRED FRONTEND TECHNOLOGY STACK.

NOTHING MORE.