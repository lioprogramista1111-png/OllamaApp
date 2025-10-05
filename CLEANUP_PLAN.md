# 🧹 Code Cleanup Plan

## Files to Remove

### 1. Backup/Test Files (Frontend)
These are old backup and test files that are no longer used:

- ✅ `src/CodeMentorAI.Web/src/app/components/ollama-chat/ollama-chat.component.ts.backup`
  - **Reason:** Backup file, not imported anywhere
  - **Size:** Large file with old implementation
  
- ✅ `src/CodeMentorAI.Web/src/app/components/ollama-chat/test-chat.component.ts`
  - **Reason:** Test component, not used in routes
  - **Purpose:** Was for testing routing
  
- ✅ `src/CodeMentorAI.Web/src/app/components/ollama-chat/simple-ollama-chat.component.ts`
  - **Status:** ⚠️ **KEEP** - This is actively used in full-app.component.ts

### 2. Unused Services (Frontend)
- ✅ `src/CodeMentorAI.Web/src/app/services/ollama-api.service.ts`
  - **Reason:** Only used in backup file (ollama-chat.component.ts.backup)
  - **Replacement:** ModelService is used instead
  
- ✅ `src/CodeMentorAI.Web/src/app/services/ollama-api.service.spec.ts`
  - **Reason:** Test file for unused service

### 3. Unused Components (Frontend)
- ⚠️ `src/CodeMentorAI.Web/src/app/components/model-browser/`
  - **Status:** PARTIALLY USED
  - **Used by:** ModelRegistryService (which IS registered in Program.cs)
  - **Decision:** **KEEP** - It's part of the model registry feature

### 4. Unused App Components
- ✅ `src/CodeMentorAI.Web/src/app/simple-app.component.ts`
  - **Reason:** Not used, full-app.component.ts is the main component
  - **Note:** Check if it's referenced in main.ts first

### 5. Root-Level Files
- ⚠️ `OllamaSetup.exe`
  - **Reason:** Binary executable in source control
  - **Decision:** Should be in .gitignore or removed
  - **Size:** Likely large

- ⚠️ `GITHUB_PUBLISH_GUIDE.md`
  - **Reason:** Duplicate of PUSH_TO_GITHUB.md
  - **Decision:** Keep one, remove the other

- ⚠️ `VISUAL_STUDIO_TEST_GUIDE.md`
  - **Reason:** Similar content to docs/VISUAL_STUDIO_GUIDE.md
  - **Decision:** Consolidate into docs folder

## Backend Analysis

### Controllers (All Used ✅)
- ✅ ChatController - Used for chat functionality
- ✅ CodeAnalysisController - Used for code analysis
- ✅ ModelRegistryController - Used by ModelRegistryService
- ✅ ModelsController - Core model management

### Services (All Used ✅)
- ✅ ModelDownloadService - Used by ModelRegistryController
- ✅ ModelPerformanceTracker - Registered in Program.cs
- ✅ ModelRegistryService - Registered in Program.cs
- ✅ OllamaService - Core service

## Unused Methods to Remove

### ModelsController.cs
- ⚠️ `GetModelsFromDisk()` - Line 54-90
  - **Used by:** Frontend model.service.ts (getModelsFromDisk method)
  - **Decision:** **KEEP** - Still has a caller

## Summary

### Safe to Remove (7 files):
1. `src/CodeMentorAI.Web/src/app/components/ollama-chat/ollama-chat.component.ts.backup`
2. `src/CodeMentorAI.Web/src/app/components/ollama-chat/test-chat.component.ts`
3. `src/CodeMentorAI.Web/src/app/services/ollama-api.service.ts`
4. `src/CodeMentorAI.Web/src/app/services/ollama-api.service.spec.ts`
5. `src/CodeMentorAI.Web/src/app/simple-app.component.ts` (if not in main.ts)
6. `OllamaSetup.exe` (binary file)
7. `GITHUB_PUBLISH_GUIDE.md` or `PUSH_TO_GITHUB.md` (keep one)

### Files to Consolidate:
1. Move `VISUAL_STUDIO_TEST_GUIDE.md` → `docs/VISUAL_STUDIO_TEST_GUIDE.md`
2. Move `GET_STARTED.md` → `docs/GET_STARTED.md`

### Keep (Active Code):
- All backend controllers and services
- simple-ollama-chat.component.ts (used in full-app)
- model-browser component (part of registry feature)
- All current documentation in docs/

## Estimated Impact

**Files to Delete:** 7 files
**Disk Space Saved:** ~500KB+ (excluding OllamaSetup.exe which could be MBs)
**Code Lines Removed:** ~1,500+ lines
**Maintenance Reduction:** Significant - removes confusing backup files

## Next Steps

1. Verify simple-app.component.ts is not in main.ts
2. Remove backup and test files
3. Remove unused ollama-api.service
4. Move root docs to docs/ folder
5. Add OllamaSetup.exe to .gitignore
6. Commit changes with clear message
7. Push to GitHub

