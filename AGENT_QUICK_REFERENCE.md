# Agent Activation Quick Reference
**For immediate use in development sessions**

## 🚨 **Critical Agent Gaps Identified**

### State Persistence Agent
**When to Activate**: File operations across multiple tools, cross-platform development
**Trigger Signals**: 
- "Parent directory does not exist" errors when directory was just created
- Path resolution inconsistencies between tools
- Context loss during tool switching

**Manual Activation Protocol**:
```
1. Before major file operations: Document current state
2. Test tool availability: Try primary tool, document fallback
3. Execute with checkpoints: Save progress every 3-5 operations
4. Verify completion: Confirm all files created successfully
```

### Tool Orchestration Agent
**When to Activate**: Multiple tools available for same task, tool conflicts
**Trigger Signals**:
- Filesystem vs bash tool conflicts
- Permission errors on file operations  
- Platform-specific path issues

**Manual Activation Protocol**:
```
1. Identify available tools for task
2. Test primary tool capability
3. Have fallback strategy ready
4. Document which tool worked for future reference
```

### Production Deployment Agent
**When to Activate**: Any production deployment or build process
**Trigger Signals**:
- Git operations needed
- Build verification required
- Environment variable dependencies
- Vercel/production deployment

**Manual Activation Protocol**:
```
1. Check git status
2. Verify environment variables
3. Run build test
4. Deploy with monitoring
5. Verify deployment success
6. Document deployment status
```

## ⚡ **Quick Activation Commands**

### For Development Sessions:
```bash
# State Persistence Check
ls -la target_directory/  # Verify directory exists
echo "Checkpoint: [operation_name] at $(date)" >> session.log

# Tool Conflict Resolution
mkdir -p path/to/directory  # Use bash for directory creation
# Then use filesystem tools for file writing

# Production Safety
git status  # Check for uncommitted changes
npm run build  # Verify build works
```

### For Error Prevention:
```typescript
// Add to all file operations
try {
  // Primary tool operation
} catch (error) {
  console.log(`Primary tool failed: ${error.message}`);
  // Fallback tool operation
}
```

## 📋 **Session Checklist**

**Pre-Session**:
- [ ] Document current project state
- [ ] Verify tool availability  
- [ ] Check git status
- [ ] Note any known issues

**During Session**:
- [ ] Log tool conflicts as they occur
- [ ] Document successful patterns
- [ ] Checkpoint progress every 30min
- [ ] Note any workarounds used

**Post-Session**:
- [ ] Update agent performance notes
- [ ] Document new patterns discovered
- [ ] Flag any recurring issues
- [ ] Plan agent enhancements needed

Use this reference to manually implement agent patterns until automated activation is available.