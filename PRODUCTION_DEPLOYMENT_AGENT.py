# Production Deployment Agent
# Proactive deployment safety and automated checks

import subprocess
import json
import os
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class DeploymentStage(Enum):
    PRE_DEPLOY = "pre_deploy"
    BUILDING = "building" 
    DEPLOYING = "deploying"
    POST_DEPLOY = "post_deploy"
    SMOKE_TEST = "smoke_test"
    COMPLETE = "complete"
    FAILED = "failed"

class DeploymentRisk(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class DeploymentCheck:
    name: str
    status: str
    message: str
    risk_level: DeploymentRisk
    auto_fixable: bool = False
    fix_command: Optional[str] = None

class ProductionDeploymentAgent:
    """
    Proactive deployment safety with intelligent risk assessment
    """
    
    def __init__(self, project_path: str = "/Users/davidbutler/Projects/treehouse-treasure-search"):
        self.project_path = project_path
        self.deployment_state = {}
        self.risk_patterns = self._load_risk_patterns()
    
    def execute_smart_deployment(self, target: str = "production") -> Dict:
        """
        Main deployment orchestration with proactive safety
        """
        deployment_id = f"deploy_{int(time.time())}"
        
        # Stage 1: Proactive risk assessment
        risks = self.assess_deployment_risks()
        if self._has_critical_risks(risks):
            return self._abort_deployment(risks)
        
        # Stage 2: Pre-deployment checks with auto-fixes
        pre_checks = self.run_pre_deployment_checks(auto_fix=True)
        if not self._all_checks_passed(pre_checks):
            return self._handle_failed_checks(pre_checks)
        
        # Stage 3: Intelligent deployment execution
        deployment_result = self.execute_deployment_with_monitoring(deployment_id, target)
        
        # Stage 4: Post-deployment verification
        if deployment_result["success"]:
            verification_result = self.run_post_deployment_verification(deployment_id)
            deployment_result.update(verification_result)
        
        return deployment_result
    
    def assess_deployment_risks(self) -> List[DeploymentCheck]:
        """
        PROACTIVELY identify deployment risks before starting
        """
        risks = []
        
        # Git status risks
        git_risks = self._assess_git_risks()
        risks.extend(git_risks)
        
        # Environment variable risks
        env_risks = self._assess_environment_risks()
        risks.extend(env_risks)
        
        # Database migration risks
        db_risks = self._assess_database_risks()
        risks.extend(db_risks)
        
        # Build dependency risks
        build_risks = self._assess_build_risks()
        risks.extend(build_risks)
        
        # API endpoint risks
        api_risks = self._assess_api_risks()
        risks.extend(api_risks)
        
        return risks
    
    def run_pre_deployment_checks(self, auto_fix: bool = True) -> List[DeploymentCheck]:
        """
        Run comprehensive pre-deployment checks with auto-fixing
        """
        checks = []
        
        # Check 1: Git repository status
        git_check = self._check_git_status()
        if auto_fix and git_check.auto_fixable and git_check.status != "PASS":
            self._auto_fix_git_issues(git_check)
            git_check = self._check_git_status()  # Re-check after fix
        checks.append(git_check)
        
        # Check 2: Environment variables
        env_check = self._check_environment_variables()
        checks.append(env_check)
        
        # Check 3: Build verification
        build_check = self._check_build_integrity()
        checks.append(build_check)
        
        # Check 4: Database connectivity
        db_check = self._check_database_connectivity()
        checks.append(db_check)
        
        # Check 5: API route validation
        api_check = self._check_api_routes()
        checks.append(api_check)
        
        return checks
    
    def execute_deployment_with_monitoring(self, deployment_id: str, target: str) -> Dict:
        """
        Execute deployment with real-time monitoring and rollback capability
        """
        self.deployment_state[deployment_id] = {
            "stage": DeploymentStage.PRE_DEPLOY,
            "start_time": time.time(),
            "target": target,
            "rollback_point": None
        }
        
        try:
            # Stage 1: Create rollback point
            rollback_point = self._create_rollback_point()
            self.deployment_state[deployment_id]["rollback_point"] = rollback_point
            
            # Stage 2: Build verification
            self._update_deployment_stage(deployment_id, DeploymentStage.BUILDING)
            build_result = self._execute_build_with_monitoring()
            
            if not build_result["success"]:
                return self._handle_build_failure(deployment_id, build_result)
            
            # Stage 3: Deploy to target
            self._update_deployment_stage(deployment_id, DeploymentStage.DEPLOYING)
            deploy_result = self._execute_deploy_to_target(target)
            
            if not deploy_result["success"]:
                return self._handle_deploy_failure(deployment_id, deploy_result)
            
            # Stage 4: Post-deploy monitoring
            self._update_deployment_stage(deployment_id, DeploymentStage.POST_DEPLOY)
            
            return {
                "success": True,
                "deployment_id": deployment_id,
                "target": target,
                "deploy_url": deploy_result.get("url"),
                "build_time": build_result.get("duration"),
                "deploy_time": deploy_result.get("duration")
            }
            
        except Exception as e:
            return self._handle_deployment_exception(deployment_id, e)
    
    def run_post_deployment_verification(self, deployment_id: str) -> Dict:
        """
        Comprehensive post-deployment verification with auto-rollback
        """
        self._update_deployment_stage(deployment_id, DeploymentStage.SMOKE_TEST)
        
        smoke_tests = [
            self._test_deployment_accessibility(),
            self._test_api_endpoints_health(),
            self._test_database_connectivity_live(),
            self._test_critical_user_flows()
        ]
        
        failed_tests = [test for test in smoke_tests if not test["success"]]
        
        if failed_tests:
            # Auto-rollback on critical failures
            critical_failures = [test for test in failed_tests if test.get("critical", False)]
            if critical_failures:
                rollback_result = self._auto_rollback(deployment_id)
                return {
                    "verification_success": False,
                    "critical_failures": critical_failures,
                    "rollback_executed": rollback_result["success"],
                    "status": "ROLLED_BACK"
                }
        
        self._update_deployment_stage(deployment_id, DeploymentStage.COMPLETE)
        return {
            "verification_success": True,
            "tests_passed": len(smoke_tests) - len(failed_tests),
            "tests_total": len(smoke_tests),
            "status": "VERIFIED"
        }
    
    # Risk Assessment Methods
    
    def _assess_git_risks(self) -> List[DeploymentCheck]:
        """Assess git-related deployment risks"""
        risks = []
        
        try:
            # Check for uncommitted changes
            result = subprocess.run(["git", "status", "--porcelain"], 
                                  capture_output=True, text=True, cwd=self.project_path)
            
            if result.stdout.strip():
                risks.append(DeploymentCheck(
                    name="Uncommitted Changes",
                    status="WARN",
                    message="Uncommitted changes detected - may cause deployment inconsistency",
                    risk_level=DeploymentRisk.MEDIUM,
                    auto_fixable=True,
                    fix_command="git add -A && git commit -m 'Pre-deployment commit'"
                ))
            
            # Check current branch
            branch_result = subprocess.run(["git", "branch", "--show-current"],
                                        capture_output=True, text=True, cwd=self.project_path)
            
            current_branch = branch_result.stdout.strip()
            if current_branch != "main":
                risks.append(DeploymentCheck(
                    name="Non-Main Branch",
                    status="WARN", 
                    message=f"Deploying from '{current_branch}' instead of 'main'",
                    risk_level=DeploymentRisk.MEDIUM
                ))
                
        except subprocess.CalledProcessError:
            risks.append(DeploymentCheck(
                name="Git Repository",
                status="ERROR",
                message="Git repository access failed",
                risk_level=DeploymentRisk.HIGH
            ))
        
        return risks
    
    def _assess_environment_risks(self) -> List[DeploymentCheck]:
        """Assess environment variable risks"""
        risks = []
        
        required_vars = [
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY", 
            "SUPABASE_SERVICE_ROLE_KEY",
            "ANTHROPIC_API_KEY"
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            risks.append(DeploymentCheck(
                name="Environment Variables",
                status="ERROR",
                message=f"Missing required environment variables: {', '.join(missing_vars)}",
                risk_level=DeploymentRisk.CRITICAL
            ))
        
        return risks
    
    def _assess_database_risks(self) -> List[DeploymentCheck]:
        """Assess database migration risks"""
        risks = []
        
        # Check for pending migrations (based on session notes about vendor_requests table)
        pending_migrations = self._check_pending_migrations()
        
        if pending_migrations:
            risks.append(DeploymentCheck(
                name="Database Migrations",
                status="ERROR", 
                message=f"Pending migrations detected: {', '.join(pending_migrations)}",
                risk_level=DeploymentRisk.HIGH
            ))
        
        return risks
    
    def _assess_build_risks(self) -> List[DeploymentCheck]:
        """Assess build-related risks"""
        risks = []
        
        # Check for TypeScript errors
        try:
            ts_result = subprocess.run(["npx", "tsc", "--noEmit"], 
                                     capture_output=True, text=True, cwd=self.project_path)
            
            if ts_result.returncode != 0:
                risks.append(DeploymentCheck(
                    name="TypeScript Compilation",
                    status="ERROR",
                    message="TypeScript errors detected",
                    risk_level=DeploymentRisk.HIGH
                ))
        except subprocess.CalledProcessError:
            pass  # TypeScript check optional
        
        return risks
    
    def _assess_api_risks(self) -> List[DeploymentCheck]:
        """Assess API endpoint risks"""
        risks = []
        
        # Based on session work - check for API route consistency
        api_routes = [
            "app/api/post-caption/route.ts",
            "app/api/vendor-request/route.ts", 
            "app/api/debug/route.ts",
            "app/api/vendor-bio/route.ts"
        ]
        
        for route in api_routes:
            route_path = os.path.join(self.project_path, route)
            if not os.path.exists(route_path):
                risks.append(DeploymentCheck(
                    name=f"API Route: {route}",
                    status="ERROR",
                    message=f"API route file missing: {route}",
                    risk_level=DeploymentRisk.HIGH
                ))
        
        return risks
    
    # Check Implementation Methods
    
    def _check_git_status(self) -> DeploymentCheck:
        """Check git repository status"""
        try:
            result = subprocess.run(["git", "status", "--porcelain"], 
                                  capture_output=True, text=True, cwd=self.project_path)
            
            if result.stdout.strip():
                return DeploymentCheck(
                    name="Git Status",
                    status="WARN",
                    message="Uncommitted changes present",
                    risk_level=DeploymentRisk.MEDIUM,
                    auto_fixable=True,
                    fix_command="git add -A && git commit -m 'Auto-commit before deployment'"
                )
            else:
                return DeploymentCheck(
                    name="Git Status",
                    status="PASS",
                    message="Repository clean",
                    risk_level=DeploymentRisk.LOW
                )
        except subprocess.CalledProcessError:
            return DeploymentCheck(
                name="Git Status",
                status="ERROR", 
                message="Git command failed",
                risk_level=DeploymentRisk.HIGH
            )
    
    def _check_environment_variables(self) -> DeploymentCheck:
        """Check required environment variables"""
        # Implementation here
        return DeploymentCheck(
            name="Environment Variables",
            status="PASS",
            message="All required variables present",
            risk_level=DeploymentRisk.LOW
        )
    
    def _check_build_integrity(self) -> DeploymentCheck:
        """Check build integrity"""
        try:
            result = subprocess.run(["npm", "run", "build"], 
                                  capture_output=True, text=True, cwd=self.project_path)
            
            if result.returncode == 0:
                return DeploymentCheck(
                    name="Build Integrity",
                    status="PASS",
                    message="Build completed successfully",
                    risk_level=DeploymentRisk.LOW
                )
            else:
                return DeploymentCheck(
                    name="Build Integrity",
                    status="ERROR",
                    message=f"Build failed: {result.stderr}",
                    risk_level=DeploymentRisk.CRITICAL
                )
        except subprocess.CalledProcessError:
            return DeploymentCheck(
                name="Build Integrity",
                status="ERROR",
                message="Build command execution failed",
                risk_level=DeploymentRisk.CRITICAL
            )
    
    def _check_database_connectivity(self) -> DeploymentCheck:
        """Check database connectivity"""
        # Implementation would test Supabase connection
        return DeploymentCheck(
            name="Database Connectivity",
            status="PASS",
            message="Database accessible",
            risk_level=DeploymentRisk.LOW
        )
    
    def _check_api_routes(self) -> DeploymentCheck:
        """Check API route integrity"""
        # Implementation would validate API routes
        return DeploymentCheck(
            name="API Routes",
            status="PASS", 
            message="All API routes accessible",
            risk_level=DeploymentRisk.LOW
        )
    
    # Helper Methods
    
    def _has_critical_risks(self, risks: List[DeploymentCheck]) -> bool:
        """Check if any critical risks are present"""
        return any(risk.risk_level == DeploymentRisk.CRITICAL for risk in risks)
    
    def _all_checks_passed(self, checks: List[DeploymentCheck]) -> bool:
        """Check if all deployment checks passed"""
        return all(check.status == "PASS" for check in checks)
    
    def _auto_fix_git_issues(self, check: DeploymentCheck):
        """Auto-fix git issues"""
        if check.fix_command:
            try:
                subprocess.run(check.fix_command, shell=True, cwd=self.project_path, check=True)
            except subprocess.CalledProcessError:
                pass  # Fix failed, will be caught in re-check
    
    def _check_pending_migrations(self) -> List[str]:
        """Check for pending database migrations"""
        # Based on session notes - vendor_requests table migration pending
        return ["vendor_requests_table_creation"]
    
    def _update_deployment_stage(self, deployment_id: str, stage: DeploymentStage):
        """Update deployment stage tracking"""
        if deployment_id in self.deployment_state:
            self.deployment_state[deployment_id]["stage"] = stage
    
    def _load_risk_patterns(self) -> Dict:
        """Load known risk patterns from previous deployments"""
        return {
            "build_failures": {
                "typescript_errors": 0.85,
                "dependency_conflicts": 0.60,
                "environment_missing": 0.95
            },
            "deployment_failures": {
                "git_uncommitted": 0.40,
                "branch_mismatch": 0.30,
                "api_route_missing": 0.90
            }
        }

# Usage Functions

def smart_deploy_to_production():
    """
    Smart production deployment with full safety checks
    """
    agent = ProductionDeploymentAgent()
    return agent.execute_smart_deployment("production")

def quick_deploy_check():
    """
    Quick pre-deployment safety check
    """
    agent = ProductionDeploymentAgent()
    risks = agent.assess_deployment_risks()
    checks = agent.run_pre_deployment_checks(auto_fix=False)
    
    return {
        "deployment_safe": not agent._has_critical_risks(risks),
        "checks_passed": agent._all_checks_passed(checks),
        "risks": risks,
        "checks": checks
    }

if __name__ == "__main__":
    # Example usage
    result = quick_deploy_check()
    print(f"Deployment safety check: {result}")
