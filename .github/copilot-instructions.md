# GitHub Copilot Instructions for TaskManager

You are assisting with the development of the TaskManager project. Before generating any code, implementing features, or suggesting modifications, you MUST strictly adhere to the following requirements.

## Development Best Practices

### E2E Testing Requirements
- **Comprehensive Test Coverage**: Create and maintain an exhaustive End-to-End (E2E) test suite that covers all user interactions, including:
  - All user-triggered actions and their side effects
  - Installation and deployment procedures
  - Data migration workflows
- **Update Tests Proactively**: Every code evolution MUST include updates to the E2E test suite to maintain coverage
- **Multi-Layer Error Checking**: E2E tests MUST verify exceptions, errors, and warnings across all application layers:
  - Frontend (UI, client-side validation)
  - Server (backend logic, API responses)
  - Middleware and communication layers
  - Database and external service interactions
- **Zero Errors Policy**: All exceptions, errors, and warnings discovered during testing MUST be fixed within the same Pull Request. Do not merge code that leaves errors unresolved.

### Data Migration
- **Implement Data Sanitizer**: Create and maintain a data sanitizer that enables users to migrate data from any old version to the current version
- **Keep Sanitizer Updated**: Every code evolution that modifies data structures MUST include sanitizer updates
- **Backward Compatibility**: Ensure users can seamlessly upgrade without data loss

### Commit Strategy: "Dry Commits" (Semantic & Atomic)
- **Semantic Commits**: Organize commits by semantic type in separate, distinct commits:
  - `feat`: New feature implementation
  - `fix`: Bug fixes
  - `docs`: Documentation updates
  - `style`: Code formatting and style changes
  - `refactor`: Code restructuring without behavior change
  - `test`: Test-related changes
  - `chore`: Maintenance and tooling
- **Functional Atomicity**: Each commit MUST be functionally atomic and self-contained:
  - One logical feature or fix per commit
  - Different bugs or features in separate commits
  - No interdependencies between commits in the same PR
- **Indentation Rule**: DO NOT FIX INDENTATION in your commits. If indentation needs fixing, it must be a separate, dedicated commit.
- **Maintenance**: This approach ensures easier code review, history traversal, and selective cherry-picking during maintenance

## Business Requirements

### Internationalization (i18n)
- **Complete Localization**: All visible text to users MUST be properly internationalized
- **Multi-Language Support**: Update all implemented language localizations whenever visible text changes
- **Keep Updated**: Every code evolution that adds or modifies user-visible text MUST include i18n updates for all supported languages
- **User Experience**: Ensure consistent terminology and tone across all languages

### Multi-Configuration Support (6 Device Configurations)
Your code MUST adapt user input and display for these six device configurations:
1. **Desktop**: Keyboard + Mouse
2. **Laptop**: Keyboard + Trackpad
3. **Laptop with Touchscreen**: Keyboard + Trackpad + Touchscreen
4. **Laptop with Mouse**: Keyboard + Trackpad + Mouse
5. **Laptop with Touchscreen and Mouse**: Keyboard + Trackpad + Mouse + Touchscreen
6. **Smartphone**: Touchscreen only

- **Design Considerations**:
  - Ensure UI elements have appropriate sizes for each input method
  - Optimize touch targets for touchscreen configurations
  - Support both keyboard and pointing device interactions
  - Test responsiveness across all six configurations
- **Keep Updated**: Every UI/UX change MUST be verified and adapted for all six configurations

### User Documentation
- **In-App Documentation**: Provide user-facing documentation accessible within the application
- **Maintain Accuracy**: Keep documentation synchronized with code changes
- **Keep Updated**: Every feature addition or user interaction change MUST include corresponding documentation updates
- **User Focus**: Documentation should be clear, helpful, and address common use cases

## Summary of Obligations

When you generate code, suggest changes, or review pull requests, you MUST:
1. ✅ Ensure E2E tests are comprehensive and cover all layers
2. ✅ Verify data migration compatibility
3. ✅ Structure commits as semantic and atomic "dry commits"
4. ✅ Confirm all visible text is internationalized
5. ✅ Validate UI/UX across all six device configurations
6. ✅ Update in-app user documentation
7. ✅ Resolve all errors before merging

If any of these requirements cannot be met in a single Pull Request, flag the omission clearly for the developer.