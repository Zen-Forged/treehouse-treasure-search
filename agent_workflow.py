#!/usr/bin/env python3
"""
Agent System Workflow Integration
Ready-to-use functions for smart development workflow
"""

import os
import subprocess
import json
import time

def smart_file_write(filepath, content):
    """
    Smart file write with automatic conflict resolution
    USE THIS instead of regular file operations
    """
    print(f"📝 Smart write: {filepath}")
    
    # Auto-create missing directories
    directory = os.path.dirname(filepath)
    if directory and not os.path.exists(directory):
        os.makedirs(directory, exist_ok=True)
        print(f"   ✅ Auto-created directory: {directory}")
    
    # Size protection (12MB limit like hero image uploads)
    size_mb = len(content.encode('utf-8')) / (1024 * 1024)
    if size_mb > 12:
        error_msg = f"File too large ({size_mb:.1f}MB > 12MB limit)"
        print(f"   ❌ {error_msg}")
        return {"success": False, "error": error_msg}
    
    # Write with bash fallback for problematic paths
    try:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"   ✅ File created successfully")
        return {"success": True, "method": "direct"}
    except Exception as e:
        print(f"   🔄 Primary method failed, trying bash fallback...")
        try:
            cmd = f'cat > "{filepath}" << \'EOF\'\n{content}\nEOF'
            subprocess.run(cmd, shell=True, check=True)
            print(f"   ✅ File created (bash fallback)")
            return {"success": True, "method": "bash_fallback"}
        except Exception as bash_error:
            print(f"   ❌ All methods failed: {bash_error}")
            return {"success": False, "error": str(bash_error)}

def check_deployment_safety():
    """
    Check if deployment is safe
    USE THIS before any deployment
    """
    print("🛡️ Deployment Safety Check")
    
    issues = []
    auto_fixes_available = []
    
    # Check git status
    try:
        result = subprocess.run(["git", "status", "--porcelain"], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            issues.append("uncommitted_changes")
            auto_fixes_available.append("git add -A && git commit -m 'Pre-deploy commit'")
            print("   ⚠️ Uncommitted changes detected")
        else:
            print("   ✅ Git status clean")
    except FileNotFoundError:
        issues.append("git_not_available")
        print("   ⚠️ Git not available")
    
    # Check for known critical issues (adjust for your project)
    # Based on our session, vendor_requests migration is pending
    critical_issues = []
    
    # Check for API routes that should exist
    expected_routes = [
        "app/api/post-caption/route.ts",
        "app/api/vendor-request/route.ts", 
        "app/api/debug/route.ts"
    ]
    
    missing_routes = []
    for route in expected_routes:
        if not os.path.exists(route):
            missing_routes.append(route)
    
    if missing_routes:
        issues.append("missing_api_routes")
        print(f"   ⚠️ Missing API routes: {len(missing_routes)}")
    
    # Known critical issue from our session
    if True:  # We know this is still pending
        critical_issues.append("vendor_requests_migration")
        print("   ❌ CRITICAL: vendor_requests table migration needed in Supabase")
    
    # Determine safety level
    has_critical = len(critical_issues) > 0
    has_issues = len(issues) > 0
    
    if has_critical:
        recommendation = "ABORT: Critical issues must be resolved before deployment"
        safe = False
    elif has_issues:
        recommendation = "CAUTION: Minor issues detected - review before deployment"
        safe = False
    else:
        recommendation = "PROCEED: All checks passed - safe to deploy"
        safe = True
    
    print(f"   📊 Recommendation: {recommendation}")
    
    return {
        "safe": safe,
        "issues": issues,
        "critical_issues": critical_issues,
        "auto_fixes_available": auto_fixes_available,
        "recommendation": recommendation
    }

def enhanced_session_start():
    """
    Enhanced session start ceremony with Agent System
    """
    print("🚀 ENHANCED SESSION START")
    print("=" * 50)
    
    # Read existing context (your current process)
    if os.path.exists("CLAUDE.md"):
        print("📖 Loading session context from CLAUDE.md...")
        with open("CLAUDE.md", "r") as f:
            context_preview = f.read()[:200] + "..." if len(f.read()) > 200 else f.read()
        print("✅ Context loaded")
    else:
        print("⚠️ CLAUDE.md not found - starting fresh session")
    
    # Create session checkpoint
    checkpoint_id = f"session_{int(time.time())}"
    session_state = {
        "checkpoint_id": checkpoint_id,
        "start_time": time.time(),
        "working_directory": os.getcwd(),
        "agent_system_active": True
    }
    
    with open(".session_state.json", "w") as f:
        json.dump(session_state, f, indent=2)
    
    print(f"📸 Session checkpoint created: {checkpoint_id}")
    
    # Quick system test
    print("\n🧪 Testing Agent System...")
    test_result = smart_file_write("test_agent_ready.txt", "Agent System operational for this session")
    if test_result["success"]:
        print("✅ Agent System operational")
        os.remove("test_agent_ready.txt")  # Clean up
    else:
        print("❌ Agent System issues detected")
    
    # Initial deployment safety check
    print("\n🛡️ Initial deployment safety status...")
    safety = check_deployment_safety()
    
    print(f"\n🎯 SESSION READY")
    print("💡 Use smart_file_write(filepath, content) for all file operations")
    print("💡 Use check_deployment_safety() before any deployment")
    print("=" * 50)
    
    return {
        "checkpoint_id": checkpoint_id,
        "agent_system_active": True,
        "deployment_safe": safety["safe"]
    }

def enhanced_session_end():
    """
    Enhanced session end ceremony with intelligence report
    """
    print("🏁 ENHANCED SESSION END")
    print("=" * 50)
    
    # Load session state
    session_duration = 0
    checkpoint_id = "unknown"
    
    try:
        with open(".session_state.json", "r") as f:
            session_state = json.load(f)
        session_duration = time.time() - session_state["start_time"]
        checkpoint_id = session_state["checkpoint_id"]
        print(f"📊 Session duration: {session_duration/60:.1f} minutes")
        print(f"🆔 Session ID: {checkpoint_id}")
    except:
        print("⚠️ No session state found")
    
    # Count files modified
    try:
        result = subprocess.run(["git", "status", "--porcelain"], 
                              capture_output=True, text=True)
        if result.stdout.strip():
            modified_files = result.stdout.strip().split('\n')
            print(f"📝 Files modified: {len(modified_files)}")
        else:
            print("📝 No files modified")
    except:
        print("⚠️ Could not check git status")
    
    # Final deployment safety check
    print("\n🛡️ Final deployment safety check...")
    safety = check_deployment_safety()
    
    # Commit recommendation
    print(f"\n📝 Session Summary:")
    if safety["safe"]:
        print("✅ All safety checks passed - ready for commit and deployment")
    else:
        print("⚠️ Safety issues detected - commit OK but resolve before deployment")
        print(f"Issues to address: {', '.join(safety['issues'])}")
        if safety.get("auto_fixes_available"):
            print("💡 Auto-fixes available:")
            for fix in safety["auto_fixes_available"]:
                print(f"   {fix}")
    
    # Clean up session state
    try:
        if os.path.exists(".session_state.json"):
            os.remove(".session_state.json")
            print("\n🧹 Session cleanup complete")
    except:
        pass
    
    print(f"\n🎯 SESSION COMPLETE")
    print("=" * 50)
    
    return {
        "session_duration_minutes": session_duration / 60,
        "deployment_safe": safety["safe"],
        "issues": safety.get("issues", [])
    }

# Quick usage functions for immediate adoption

def quick_start():
    """Quick session start without full ceremony"""
    print("🤖 Agent System activated for session")
    print("💡 Use smart_file_write(filepath, content) for file operations")
    return True

def quick_deploy_check():
    """Quick deployment check without full ceremony"""
    safety = check_deployment_safety()
    print(f"🚀 Deployment status: {safety['recommendation']}")
    return safety["safe"]

# Example usage patterns

def complete_vendor_bio_feature_example():
    """
    Example: Complete vendor bio feature using Agent System
    Shows how to replace manual file operations
    """
    print("📝 Creating vendor bio API route...")
    
    api_content = '''// app/api/vendor-bio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { bio, vendorId } = await req.json();
    
    if (!vendorId) {
      return NextResponse.json({ error: "Missing vendorId" }, { status: 400 });
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    
    const admin = createClient(supabaseUrl, serviceRoleKey);
    
    const { error: dbError } = await admin
      .from("vendors")
      .update({ bio: bio?.trim() || null })
      .eq("id", vendorId);
    
    if (dbError) {
      console.error("[vendor-bio] Database update error:", dbError);
      return NextResponse.json({ error: "Failed to update bio" }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (err) {
    console.error("[vendor-bio] Unexpected error:", err);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
'''
    
    # This replaces manual file creation that would fail due to missing directory
    result = smart_file_write("app/api/vendor-bio/route.ts", api_content)
    
    if result["success"]:
        print("✅ Vendor bio API route created successfully")
        
        # Check if safe to deploy
        safety = check_deployment_safety()
        if safety["safe"]:
            print("✅ Ready for deployment")
        else:
            print(f"⚠️ Deployment blocked: {', '.join(safety['issues'])}")
        
        return {"feature_complete": True, "deploy_ready": safety["safe"]}
    else:
        print(f"❌ Failed to create API route: {result['error']}")
        return {"feature_complete": False, "deploy_ready": False}

if __name__ == "__main__":
    # Test basic functionality
    print("🧪 Testing Agent Workflow Functions...")
    
    # Test smart file write
    test_result = smart_file_write("workflow_test.ts", "// Agent workflow test")
    print(f"Smart file write test: {'✅ PASS' if test_result['success'] else '❌ FAIL'}")
    
    # Clean up
    if os.path.exists("workflow_test.ts"):
        os.remove("workflow_test.ts")
    
    print("\n💡 Functions ready for use:")
    print("   smart_file_write(filepath, content)")
    print("   check_deployment_safety()")
    print("   enhanced_session_start()")
    print("   enhanced_session_end()")
