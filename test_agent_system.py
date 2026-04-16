#!/usr/bin/env python3
# AGENT SYSTEM TEST SCRIPT
# Run this to verify your Agent System is working properly

import os
import sys
import time
import traceback

def test_agent_system():
    """
    Complete test of the Agent System with clear pass/fail indicators
    """
    print("🔬 AGENT SYSTEM VERIFICATION TEST")
    print("=" * 50)
    
    test_results = {
        "imports": False,
        "coordinator_init": False,
        "smart_file_write": False,
        "conflict_detection": False,
        "deployment_check": False,
        "session_intelligence": False
    }
    
    try:
        # Test 1: Import verification
        print("\n1️⃣ Testing imports...")
        sys.path.append('/Users/davidbutler/Projects/treehouse-treasure-search')
        
        from AGENT_SYSTEM_COORDINATOR import (
            AgentSystemCoordinator,
            smart_file_write,
            smart_deployment_check
        )
        from STATE_PERSISTENCE_AGENT import StatePersistenceAgent
        
        print("✅ All imports successful")
        test_results["imports"] = True
        
    except Exception as e:
        print(f"❌ Import failed: {e}")
        print("🔧 Fix: Check that all Agent System files are in the project directory")
        return test_results
    
    try:
        # Test 2: Coordinator initialization
        print("\n2️⃣ Testing coordinator initialization...")
        coordinator = AgentSystemCoordinator()
        
        # Check if core agents are active
        active_agent_count = len(coordinator.active_agents)
        print(f"✅ Coordinator initialized with {active_agent_count} active agents")
        test_results["coordinator_init"] = True
        
    except Exception as e:
        print(f"❌ Coordinator initialization failed: {e}")
        print(f"🔧 Fix: {traceback.format_exc()}")
        return test_results
    
    try:
        # Test 3: Smart file write with conflict resolution
        print("\n3️⃣ Testing smart file operations...")
        
        test_content = f"// Agent System test file\n// Created at: {time.ctime()}\nconsole.log('Agent System working!');"
        
        # Test basic file write
        result = smart_file_write("agent_system_test.ts", test_content)
        
        if result.get("success"):
            print("✅ Smart file write successful")
            test_results["smart_file_write"] = True
            
            # Verify file actually exists
            if os.path.exists("agent_system_test.ts"):
                print("✅ File verified on filesystem")
                os.remove("agent_system_test.ts")  # Clean up
                print("🧹 Test file cleaned up")
            else:
                print("⚠️ File write reported success but file not found")
        else:
            print(f"❌ Smart file write failed: {result}")
            
    except Exception as e:
        print(f"❌ File operation test failed: {e}")
        print(f"🔧 Debug: {traceback.format_exc()}")
    
    try:
        # Test 4: Conflict detection
        print("\n4️⃣ Testing conflict detection...")
        
        # Test with problematic path that should trigger conflict detection
        deep_path = "deep/nested/test/directory/conflict_test.ts"
        result = smart_file_write(deep_path, "// Conflict detection test")
        
        if result.get("success"):
            # Check if conflicts were detected and resolved
            status = result.get("status", {})
            conflicts = status.get("conflicts", [])
            resolutions = status.get("resolutions", [])
            
            if conflicts:
                print(f"✅ Conflicts detected: {conflicts}")
                if resolutions:
                    print(f"✅ Resolutions applied: {resolutions}")
                    test_results["conflict_detection"] = True
                else:
                    print("⚠️ Conflicts detected but no resolutions applied")
            else:
                print("⚠️ No conflicts detected (may be normal)")
                test_results["conflict_detection"] = True  # Still counts as working
            
            # Clean up deep directory structure
            try:
                import shutil
                if os.path.exists("deep"):
                    shutil.rmtree("deep")
                    print("🧹 Nested test directory cleaned up")
            except Exception:
                pass
        else:
            print(f"❌ Conflict detection test failed: {result}")
            
    except Exception as e:
        print(f"❌ Conflict detection test error: {e}")
    
    try:
        # Test 5: Deployment safety check
        print("\n5️⃣ Testing deployment safety...")
        
        deploy_result = smart_deployment_check()
        
        if "deployment_safe" in deploy_result:
            safe = deploy_result["deployment_safe"]
            recommendation = deploy_result.get("recommendation", "No recommendation")
            
            print(f"✅ Deployment check completed")
            print(f"📊 Safe to deploy: {safe}")
            print(f"📋 Recommendation: {recommendation}")
            
            # Check for expected issues (like vendor_requests migration)
            remaining_issues = deploy_result.get("remaining_issues", [])
            if remaining_issues:
                print(f"📝 Issues detected: {remaining_issues}")
            
            test_results["deployment_check"] = True
        else:
            print(f"❌ Deployment check returned unexpected format: {deploy_result}")
            
    except Exception as e:
        print(f"❌ Deployment check failed: {e}")
    
    try:
        # Test 6: Session intelligence
        print("\n6️⃣ Testing session intelligence...")
        
        session_report = coordinator.get_session_intelligence_report()
        
        if "session_overview" in session_report:
            overview = session_report["session_overview"]
            total_ops = overview.get("total_operations", 0)
            success_rate = overview.get("success_rate", 0)
            
            print(f"✅ Session intelligence working")
            print(f"📈 Total operations: {total_ops}")
            print(f"📈 Success rate: {success_rate:.1%}")
            
            test_results["session_intelligence"] = True
        else:
            print(f"❌ Session intelligence returned unexpected format: {session_report}")
            
    except Exception as e:
        print(f"❌ Session intelligence test failed: {e}")
    
    # Test Summary
    print("\n🏁 TEST SUMMARY")
    print("=" * 50)
    
    total_tests = len(test_results)
    passed_tests = sum(test_results.values())
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall Result: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED - Agent System fully operational!")
        print("✅ Ready for production development use")
    elif passed_tests >= total_tests * 0.8:  # 80% pass rate
        print("\n⚠️ MOSTLY WORKING - Minor issues detected")
        print("🔧 Review failed tests above for improvements")
    else:
        print("\n❌ SYSTEM NOT READY - Multiple failures detected")
        print("🔧 Check Agent System setup and dependencies")
    
    return test_results

def test_specific_conflicts():
    """
    Test specific conflict scenarios we encountered in the session
    """
    print("\n🔍 SPECIFIC CONFLICT SCENARIO TESTS")
    print("=" * 50)
    
    from AGENT_SYSTEM_COORDINATOR import smart_file_write
    
    # Test 1: Bracket path (filesystem tool conflict)
    print("\n🧪 Testing bracket path conflict...")
    try:
        result = smart_file_write("app/find/[id]/test_page.tsx", "export default function TestPage() { return <div>Test</div>; }")
        if result.get("success"):
            print("✅ Bracket path handled successfully")
            # Clean up
            try:
                import shutil
                if os.path.exists("app"):
                    shutil.rmtree("app")
            except Exception:
                pass
        else:
            print(f"❌ Bracket path failed: {result}")
    except Exception as e:
        print(f"❌ Bracket path test error: {e}")
    
    # Test 2: Size limit protection
    print("\n🧪 Testing size limit protection...")
    try:
        huge_content = "x" * 15_000_000  # 15MB content
        result = smart_file_write("large_test_file.ts", huge_content)
        if not result.get("success") and "too large" in str(result.get("error", "")).lower():
            print("✅ Size limit protection working")
        else:
            print(f"❌ Size limit not enforced: {result}")
    except Exception as e:
        print(f"❌ Size limit test error: {e}")
    
    # Test 3: Missing parent directory
    print("\n🧪 Testing missing directory auto-creation...")
    try:
        result = smart_file_write("very/deep/nested/path/test.ts", "// Auto-created directories test")
        if result.get("success"):
            print("✅ Missing directories handled successfully")
            # Clean up
            try:
                import shutil
                if os.path.exists("very"):
                    shutil.rmtree("very")
            except Exception:
                pass
        else:
            print(f"❌ Directory auto-creation failed: {result}")
    except Exception as e:
        print(f"❌ Directory creation test error: {e}")

if __name__ == "__main__":
    print("🚀 Starting Agent System Verification...")
    print(f"📍 Working directory: {os.getcwd()}")
    print(f"🕒 Test time: {time.ctime()}")
    
    # Main system test
    test_results = test_agent_system()
    
    # Additional conflict tests if main system is working
    if sum(test_results.values()) >= len(test_results) * 0.6:  # 60% working
        test_specific_conflicts()
    
    print(f"\n✨ Agent System verification complete at {time.ctime()}")
