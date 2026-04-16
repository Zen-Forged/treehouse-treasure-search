# HOW TO USE & VERIFY THE AGENT SYSTEM
# Step-by-step guide with real examples and verification methods

## 🚀 STEP 1: Basic Setup & Verification

### Import the System
```python
# Add this to the start of your development session
import sys
sys.path.append('/Users/davidbutler/Projects/treehouse-treasure-search')

from AGENT_SYSTEM_COORDINATOR import (
    AgentSystemCoordinator,
    smart_file_write,
    smart_deployment_check,
    handle_file_conflict
)

# Initialize the coordinator
coordinator = AgentSystemCoordinator()
print("✅ Agent System Activated")
```

### Verify It's Working
```python
# Test basic functionality
test_result = coordinator.get_session_intelligence_report()
print(f"Session ID: {test_result['session_overview']['session_id']}")
print(f"Active agents: {list(test_result['agent_performance'].keys())}")

# Should output something like:
# Session ID: session_1713283459
# Active agents: ['state_persistence']
```

## 🔧 STEP 2: Using Smart File Operations

### Example 1: Create API Route (Real Example from Our Session)
```python
# OLD WAY (prone to conflicts):
# with open("app/api/vendor-bio/route.ts", "w") as f:
#     f.write(api_content)  # Could fail with "Parent directory does not exist"

# NEW WAY (conflict-resistant):
api_content = '''// app/api/vendor-bio/route.ts
import { NextRequest, NextResponse } from "next/server";
// ... rest of API route content
'''

result = smart_file_write("app/api/vendor-bio/route.ts", api_content)
print(f"File write result: {result}")

# Expected output:
# {
#   'success': True,
#   'operation_id': 'abc123def456',
#   'status': {
#     'operation_id': 'abc123def456',
#     'type': 'file_write',
#     'state': 'completed',
#     'success': True,
#     'conflicts': ['missing_parent_directory'],
#     'resolutions': ['created_parent_directory']
#   }
# }
```

### Verification Signs It's Working:
✅ `success: True` - Operation completed  
✅ `conflicts: ['missing_parent_directory']` - System detected potential conflict  
✅ `resolutions: ['created_parent_directory']` - System auto-fixed the conflict  
✅ File actually exists at the target location

### Example 2: Handle Bracket Path Conflicts
```python
# This would normally fail with filesystem tools:
problematic_path = "app/find/[id]/page.tsx"
component_content = "// React component content here"

result = smart_file_write(problematic_path, component_content)
print(f"Bracket path result: {result}")

# Expected output:
# {
#   'success': True,
#   'method': 'bash_fallback',
#   'conflicts_detected': ['filesystem_bracket_path'],
#   'resolution_applied': 'switch_to_bash_tools'
# }
```

### Verification Signs:
✅ `method: 'bash_fallback'` - System switched tools automatically  
✅ `conflicts_detected: ['filesystem_bracket_path']` - Predicted the issue  
✅ File exists despite bracket path

## 🛡️ STEP 3: Deployment Safety Checks

### Run Pre-Deployment Safety Check
```python
# Before deploying to production
deploy_check = smart_deployment_check()
print(f"Deployment Safety Report:")
print(f"Safe to deploy: {deploy_check['deployment_safe']}")
print(f"Recommendation: {deploy_check['recommendation']}")
print(f"Auto-fixes applied: {deploy_check['auto_fixes_applied']}")
print(f"Remaining issues: {deploy_check['remaining_issues']}")

# Expected output:
# Safe to deploy: False
# Recommendation: ABORT: Critical risks detected - deployment not safe  
# Auto-fixes applied: ['git_uncommitted_changes']
# Remaining issues: ['vendor_requests_migration_pending']
```

### Verification Signs It's Working:
✅ Detected the vendor_requests migration issue we know exists  
✅ Auto-fixed git issues (committed uncommitted changes)  
✅ Provided clear recommendation with reasoning  
✅ Listed specific remaining blockers

### Safe Deployment Example
```python
# After fixing issues, check again
deploy_check = smart_deployment_check()

if deploy_check['deployment_safe']:
    print("✅ All safety checks passed - proceeding with deployment")
    # Your deployment command here
    # subprocess.run(["npx", "vercel", "--prod"])
else:
    print(f"❌ Deployment blocked: {deploy_check['remaining_issues']}")
```

## 📊 STEP 4: Session Intelligence & Learning

### Monitor Session Progress
```python
# Get real-time session insights
session_report = coordinator.get_session_intelligence_report()

print(f"Session Statistics:")
print(f"- Operations completed: {session_report['session_overview']['total_operations']}")
print(f"- Success rate: {session_report['session_overview']['success_rate']:.1%}")
print(f"- Conflicts learned: {session_report['conflict_patterns_learned']}")
print(f"- Most common conflicts: {session_report['session_overview']['most_common_conflicts']}")

# Expected output:
# Session Statistics:
# - Operations completed: 12
# - Success rate: 91.7%
# - Conflicts learned: 3
# - Most common conflicts: [('missing_parent_directory', 4), ('filesystem_bracket_path', 2)]
```

### Verification Signs:
✅ Operations are being tracked automatically  
✅ Success rate shows system is working (>85% is good)  
✅ Conflict patterns are being learned  
✅ Common conflicts match what you experienced

### Create & Use Checkpoints
```python
from STATE_PERSISTENCE_AGENT import StatePersistenceAgent

state_agent = StatePersistenceAgent()

# Create checkpoint before major changes
checkpoint_id = state_agent.create_checkpoint("before_bio_feature")
print(f"Checkpoint created: {checkpoint_id}")

# If something goes wrong later:
# rollback_result = coordinator.emergency_rollback(checkpoint_id)
# print(f"Rollback successful: {rollback_result['success']}")
```

## 🚨 STEP 5: Testing Conflict Resolution

### Simulate Known Conflicts
```python
# Test 1: Missing directory conflict
result = smart_file_write("deep/nested/nonexistent/path/test.ts", "console.log('test');")
print(f"Missing directory test: {result['success']}")
# Should be True - system creates directories automatically

# Test 2: Size limit protection  
huge_content = "x" * 15_000_000  # 15MB content
result = smart_file_write("test_large.ts", huge_content)
print(f"Size limit test: {result['success']}")
# Should be False - system rejects files >12MB

# Test 3: Bracket path handling
result = smart_file_write("app/test/[dynamic]/page.tsx", "export default function Page() {}")
print(f"Bracket path test: {result['success']}")
# Should be True - system switches to bash tools
```

### Verification Signs:
✅ Missing directory test succeeds (auto-created directories)  
✅ Size limit test fails with clear error message  
✅ Bracket path test succeeds (used bash fallback)

## 🔍 STEP 6: Monitoring & Debugging

### Check if Agents are Active
```python
# See which agents are currently active
active_agents = list(coordinator.active_agents.keys())
print(f"Active agents: {[agent.value for agent in active_agents]}")

# Expected output:
# Active agents: ['state_persistence', 'smart_orchestration', 'production_deployment']
```

### Monitor Console for Agent Activity
```python
# Agent systems log their activity to console
# Look for these log patterns:

# State Persistence Agent:
# [state_persistence] Operation abc123 started: file_write
# [state_persistence] Conflicts predicted: missing_parent_directory
# [state_persistence] Resolution applied: created_parent_directory

# Smart Orchestration:
# [orchestration] Switching to bash fallback for bracket path
# [orchestration] Directory pre-creation successful

# Production Deployment:
# [deployment] Risk assessment: 2 medium risks, 1 critical risk
# [deployment] Auto-fix applied: git commit uncommitted changes
```

### Debug Failed Operations
```python
# If an operation fails, get detailed diagnostics
failed_result = smart_file_write("problematic/path.ts", "content")

if not failed_result['success']:
    print(f"Operation failed: {failed_result['error']}")
    
    # Get conflict resolution suggestions
    conflict_result = handle_file_conflict(
        "file_write", 
        "problematic/path.ts", 
        failed_result['error']
    )
    
    print(f"Conflict resolved: {conflict_result['conflict_resolved']}")
    print(f"Resolutions applied: {conflict_result['resolutions_applied']}")
```

## ✅ STEP 7: Success Indicators

### Signs the System is Working Well:
1. **High Success Rate**: `session_report['success_rate'] > 0.85`
2. **Automatic Conflict Resolution**: Operations succeed despite predicted conflicts
3. **Learning Patterns**: `conflict_patterns_learned` increases over time
4. **Deployment Safety**: Catches known issues like missing migrations
5. **No Manual Workarounds**: You stop manually creating directories or switching tools

### Signs the System Needs Attention:
1. **Low Success Rate**: `< 70%` suggests configuration issues
2. **Repeated Conflicts**: Same conflicts not getting auto-resolved
3. **No Learning**: `conflict_patterns_learned` stays at 0
4. **Agent Activation Failures**: Agents not appearing in active list

## 🚀 STEP 8: Daily Usage Pattern

### Start of Session:
```python
# 1. Activate system
from AGENT_SYSTEM_COORDINATOR import *
coordinator = AgentSystemCoordinator()

# 2. Create checkpoint
checkpoint = coordinator.active_agents['state_persistence'].create_checkpoint("session_start")

# 3. Check system status
report = coordinator.get_session_intelligence_report()
print(f"System ready - {len(coordinator.active_agents)} agents active")
```

### During Development:
```python
# Use smart operations for all file work
result = smart_file_write("path/to/file.ts", content)

# Check deployment safety before any deploys
deploy_check = smart_deployment_check()
```

### End of Session:
```python
# Get session summary
final_report = coordinator.get_session_intelligence_report()
print(f"Session complete:")
print(f"- {final_report['session_overview']['total_operations']} operations")
print(f"- {final_report['session_overview']['success_rate']:.1%} success rate")
print(f"- {final_report['conflict_patterns_learned']} new patterns learned")
```

## 🎯 IMMEDIATE TEST

**Try this right now to verify the system works:**

```python
# Copy/paste this entire block:
import sys
sys.path.append('/Users/davidbutler/Projects/treehouse-treasure-search')

from AGENT_SYSTEM_COORDINATOR import smart_file_write

# Test file creation with automatic conflict resolution
test_content = "// Test file created by Agent System"
result = smart_file_write("test_agent_system.ts", test_content)

print(f"🎯 Agent System Test Results:")
print(f"Success: {result['success']}")
print(f"Operation ID: {result.get('operation_id', 'N/A')}")
if 'status' in result:
    print(f"Conflicts detected: {result['status']['conflicts']}")
    print(f"Resolutions applied: {result['status']['resolutions']}")

# Verify file was actually created
import os
if os.path.exists("test_agent_system.ts"):
    print("✅ File successfully created - Agent System working!")
    os.remove("test_agent_system.ts")  # Clean up
else:
    print("❌ File not created - Check Agent System setup")
```

**Expected Output:**
```
🎯 Agent System Test Results:
Success: True
Operation ID: op_1713283459_file_write
Conflicts detected: []
Resolutions applied: []
✅ File successfully created - Agent System working!
```

This test confirms the entire system is operational and ready for use in your development workflow.

