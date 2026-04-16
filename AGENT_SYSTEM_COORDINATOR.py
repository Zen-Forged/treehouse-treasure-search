# Agent System Integration & Activation
# Coordinated agent activation with intelligent routing

import os
import json
import time
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass
from enum import Enum

# Import agent modules
from SMART_AGENT_ORCHESTRATION import AgentOrchestrator, ConflictType
from PRODUCTION_DEPLOYMENT_AGENT import ProductionDeploymentAgent, DeploymentCheck
from STATE_PERSISTENCE_AGENT import StatePersistenceAgent, OperationState

class AgentType(Enum):
    STATE_PERSISTENCE = "state_persistence"
    SMART_ORCHESTRATION = "smart_orchestration"
    PRODUCTION_DEPLOYMENT = "production_deployment" 
    CODE_ARCHITECTURE = "code_architecture"
    API_DEVELOPMENT = "api_development"
    PRODUCTION_SAFETY = "production_safety"

class ActivationTrigger(Enum):
    FILE_OPERATION = "file_operation"
    DEPLOYMENT_REQUEST = "deployment_request"
    CONFLICT_DETECTED = "conflict_detected"
    ERROR_ENCOUNTERED = "error_encountered"
    SESSION_START = "session_start"
    MANUAL_ACTIVATION = "manual_activation"

@dataclass
class AgentCapability:
    agent_type: AgentType
    handles_operations: List[str]
    handles_conflicts: List[ConflictType]
    activation_triggers: List[ActivationTrigger]
    priority_level: int  # 1 = highest priority
    auto_activate: bool = True

class AgentSystemCoordinator:
    """
    Master coordinator for all agent systems with intelligent activation
    """
    
    def __init__(self, project_path: str = "/Users/davidbutler/Projects/treehouse-treasure-search"):
        self.project_path = project_path
        self.active_agents = {}
        self.agent_capabilities = self._define_agent_capabilities()
        self.session_state = {}
        self.conflict_resolution_queue = []
        
        # Initialize core agents
        self._initialize_core_agents()
        
    def process_operation_request(self, operation_type: str, **parameters) -> Dict[str, Any]:
        """
        Main entry point - intelligently route operations through appropriate agents
        """
        operation_id = f"op_{int(time.time())}_{operation_type}"
        
        # Step 1: Determine which agents should handle this operation
        required_agents = self._determine_required_agents(operation_type, parameters)
        
        # Step 2: Activate required agents
        activated_agents = self._activate_agents(required_agents)
        
        # Step 3: Coordinate operation execution
        result = self._coordinate_operation_execution(operation_id, operation_type, parameters, activated_agents)
        
        # Step 4: Handle any conflicts that arose
        if not result.get("success", False):
            conflict_resolution = self._handle_operation_conflicts(operation_id, result, activated_agents)
            if conflict_resolution.get("resolved", False):
                # Retry operation after conflict resolution
                result = self._retry_operation_after_resolution(operation_id, operation_type, parameters, activated_agents)
        
        return result
    
    def activate_deployment_safety_check(self) -> Dict[str, Any]:
        """
        Activate comprehensive deployment safety check
        """
        # Activate Production Deployment Agent
        deployment_agent = self._ensure_agent_active(AgentType.PRODUCTION_DEPLOYMENT)
        
        # Run safety check
        safety_result = deployment_agent.assess_deployment_risks()
        pre_checks = deployment_agent.run_pre_deployment_checks(auto_fix=True)
        
        return {
            "deployment_safe": not deployment_agent._has_critical_risks(safety_result),
            "auto_fixes_applied": [check.name for check in pre_checks if check.auto_fixable and check.status == "PASS"],
            "remaining_issues": [check.name for check in pre_checks if check.status != "PASS"],
            "risk_assessment": safety_result,
            "recommendation": self._generate_deployment_recommendation(safety_result, pre_checks)
        }
    
    def handle_file_operation_conflict(self, operation_type: str, target_path: str, error_message: str, **parameters) -> Dict[str, Any]:
        """
        Handle file operation conflicts with multi-agent coordination
        """
        # Activate State Persistence Agent for conflict tracking
        state_agent = self._ensure_agent_active(AgentType.STATE_PERSISTENCE)
        
        # Activate Smart Orchestration for conflict resolution
        orchestrator = self._ensure_agent_active(AgentType.SMART_ORCHESTRATION)
        
        # Begin operation tracking
        operation_id = state_agent.begin_operation(operation_type, target_path, **parameters)
        
        # Detect conflicts from error message
        runtime_conflicts = state_agent._detect_runtime_conflicts(error_message)
        
        # Apply intelligent resolution
        resolution_results = []
        for conflict in runtime_conflicts:
            resolution = orchestrator.resolve_conflicts_proactively(operation_type, 
                                                                   {"path": target_path, **parameters}, 
                                                                   [ConflictType.FILESYSTEM_PATH])  # Map to ConflictType enum
            resolution_results.append(resolution)
        
        # Execute operation with resolutions applied
        execution_result = self._execute_operation_with_resolutions(operation_type, target_path, resolution_results, parameters)
        
        # Update state tracking
        state_agent.update_operation_state(
            operation_id, 
            OperationState.COMPLETED if execution_result["success"] else OperationState.FAILED,
            error_message=execution_result.get("error"),
            success=execution_result["success"]
        )
        
        return {
            "conflict_resolved": execution_result["success"],
            "conflicts_detected": runtime_conflicts,
            "resolutions_applied": [r.get("primary_strategy") for r in resolution_results],
            "operation_id": operation_id,
            "final_result": execution_result
        }
    
    def get_session_intelligence_report(self) -> Dict[str, Any]:
        """
        Generate comprehensive session intelligence report
        """
        state_agent = self.active_agents.get(AgentType.STATE_PERSISTENCE)
        session_summary = state_agent.get_session_summary() if state_agent else {}
        
        agent_performance = {}
        for agent_type, agent in self.active_agents.items():
            if hasattr(agent, 'get_performance_metrics'):
                agent_performance[agent_type.value] = agent.get_performance_metrics()
            else:
                agent_performance[agent_type.value] = {"status": "active", "operations_handled": "unknown"}
        
        return {
            "session_overview": session_summary,
            "agent_performance": agent_performance,
            "conflict_patterns_learned": len(state_agent.conflict_patterns) if state_agent else 0,
            "recommendations": self._generate_session_recommendations(),
            "next_session_optimizations": self._suggest_next_session_optimizations()
        }
    
    def emergency_rollback(self, checkpoint_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Emergency rollback using state persistence
        """
        state_agent = self._ensure_agent_active(AgentType.STATE_PERSISTENCE)
        
        if checkpoint_id:
            rollback_success = state_agent.restore_from_checkpoint(checkpoint_id)
        else:
            # Find most recent checkpoint
            checkpoints = [f for f in os.listdir(self.project_path) if f.startswith('.checkpoint_')]
            if not checkpoints:
                return {"success": False, "error": "No checkpoints available"}
            
            latest_checkpoint = sorted(checkpoints)[-1]
            checkpoint_id = latest_checkpoint.replace('.checkpoint_', '').replace('.json', '')
            rollback_success = state_agent.restore_from_checkpoint(checkpoint_id)
        
        return {
            "success": rollback_success,
            "checkpoint_restored": checkpoint_id,
            "timestamp": time.time()
        }
    
    def _determine_required_agents(self, operation_type: str, parameters: Dict) -> List[AgentType]:
        """
        Intelligently determine which agents are needed for an operation
        """
        required = []
        
        # Always activate State Persistence for tracking
        required.append(AgentType.STATE_PERSISTENCE)
        
        # Operation-specific agent requirements
        if operation_type in ["file_write", "file_create", "directory_create"]:
            required.append(AgentType.SMART_ORCHESTRATION)
            
            # Check if this involves API routes or production code
            target_path = parameters.get("path", "")
            if "/api/" in target_path or "route.ts" in target_path:
                required.append(AgentType.API_DEVELOPMENT)
                required.append(AgentType.PRODUCTION_SAFETY)
        
        elif operation_type == "deployment":
            required.append(AgentType.PRODUCTION_DEPLOYMENT)
            required.append(AgentType.PRODUCTION_SAFETY)
        
        elif operation_type in ["git_commit", "git_push"]:
            required.append(AgentType.PRODUCTION_DEPLOYMENT)
        
        # Add Code Architecture agent for any file operations in the codebase
        if any(ext in parameters.get("path", "") for ext in [".ts", ".tsx", ".js", ".jsx"]):
            required.append(AgentType.CODE_ARCHITECTURE)
        
        return list(set(required))  # Remove duplicates
    
    def _activate_agents(self, agent_types: List[AgentType]) -> Dict[AgentType, Any]:
        """
        Activate the required agents
        """
        activated = {}
        
        for agent_type in agent_types:
            agent = self._ensure_agent_active(agent_type)
            if agent:
                activated[agent_type] = agent
        
        return activated
    
    def _ensure_agent_active(self, agent_type: AgentType) -> Any:
        """
        Ensure a specific agent is active and return its instance
        """
        if agent_type not in self.active_agents:
            if agent_type == AgentType.STATE_PERSISTENCE:
                self.active_agents[agent_type] = StatePersistenceAgent(self.project_path)
            elif agent_type == AgentType.SMART_ORCHESTRATION:
                self.active_agents[agent_type] = AgentOrchestrator()
            elif agent_type == AgentType.PRODUCTION_DEPLOYMENT:
                self.active_agents[agent_type] = ProductionDeploymentAgent(self.project_path)
            else:
                # For agents not yet implemented, create placeholder
                self.active_agents[agent_type] = type('Agent', (), {
                    'handle_operation': lambda self, *args, **kwargs: {"success": True, "method": "placeholder"}
                })()
        
        return self.active_agents[agent_type]
    
    def _coordinate_operation_execution(self, operation_id: str, operation_type: str, parameters: Dict, agents: Dict) -> Dict[str, Any]:
        """
        Coordinate execution across multiple agents
        """
        # Primary execution through Smart Orchestration if available
        if AgentType.SMART_ORCHESTRATION in agents:
            orchestrator = agents[AgentType.SMART_ORCHESTRATION]
            result = orchestrator.execute_smart_operation(operation_type, parameters)
        else:
            # Fallback direct execution
            result = self._execute_operation_direct(operation_type, parameters)
        
        # Let State Persistence track the result
        if AgentType.STATE_PERSISTENCE in agents:
            state_agent = agents[AgentType.STATE_PERSISTENCE]
            state_agent.update_operation_state(
                operation_id,
                OperationState.COMPLETED if result.get("success") else OperationState.FAILED,
                error_message=result.get("error"),
                success=result.get("success")
            )
        
        return result
    
    def _handle_operation_conflicts(self, operation_id: str, failed_result: Dict, agents: Dict) -> Dict[str, Any]:
        """
        Handle conflicts that arise during operation execution
        """
        conflict_resolution = {"resolved": False, "resolutions": []}
        
        error_message = failed_result.get("error", "")
        
        # Use State Persistence to detect runtime conflicts
        if AgentType.STATE_PERSISTENCE in agents:
            state_agent = agents[AgentType.STATE_PERSISTENCE]
            runtime_conflicts = state_agent._detect_runtime_conflicts(error_message)
            
            # Apply automatic resolutions
            for conflict in runtime_conflicts:
                resolution_result = state_agent.resolve_conflict_automatically(operation_id, conflict)
                conflict_resolution["resolutions"].append(resolution_result)
                
                if resolution_result["success"]:
                    conflict_resolution["resolved"] = True
        
        return conflict_resolution
    
    def _retry_operation_after_resolution(self, operation_id: str, operation_type: str, parameters: Dict, agents: Dict) -> Dict[str, Any]:
        """
        Retry operation after conflict resolution
        """
        # Update operation state to retry
        if AgentType.STATE_PERSISTENCE in agents:
            state_agent = agents[AgentType.STATE_PERSISTENCE]
            state_agent.update_operation_state(operation_id, OperationState.PENDING)
        
        # Re-execute operation
        return self._coordinate_operation_execution(operation_id, operation_type, parameters, agents)
    
    def _execute_operation_with_resolutions(self, operation_type: str, target_path: str, resolutions: List[Dict], parameters: Dict) -> Dict[str, Any]:
        """
        Execute operation with conflict resolutions applied
        """
        # Apply pre-actions from resolutions
        for resolution in resolutions:
            for pre_action in resolution.get("pre_actions", []):
                if pre_action["action"] == "create_directory_bash":
                    try:
                        os.makedirs(os.path.dirname(target_path), exist_ok=True)
                    except Exception:
                        pass
        
        # Execute the actual operation
        if operation_type == "file_write":
            try:
                content = parameters.get("content", "")
                with open(target_path, 'w') as f:
                    f.write(content)
                return {"success": True, "method": "direct_write"}
            except Exception as e:
                # Try bash fallback
                try:
                    import subprocess
                    content = parameters.get("content", "")
                    cmd = f'cat > "{target_path}" << \'EOF\'\n{content}\nEOF'
                    subprocess.run(cmd, shell=True, check=True)
                    return {"success": True, "method": "bash_fallback"}
                except Exception as bash_error:
                    return {"success": False, "error": str(bash_error)}
        
        return {"success": False, "error": "Operation not implemented"}
    
    def _execute_operation_direct(self, operation_type: str, parameters: Dict) -> Dict[str, Any]:
        """
        Direct operation execution without agent coordination
        """
        if operation_type == "file_write":
            try:
                path = parameters.get("path")
                content = parameters.get("content", "")
                with open(path, 'w') as f:
                    f.write(content)
                return {"success": True, "method": "direct"}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        return {"success": False, "error": "Operation not supported"}
    
    def _generate_deployment_recommendation(self, risks: List[DeploymentCheck], checks: List[DeploymentCheck]) -> str:
        """
        Generate intelligent deployment recommendation
        """
        critical_risks = [r for r in risks if r.risk_level.value == "critical"]
        failed_checks = [c for c in checks if c.status != "PASS"]
        
        if critical_risks:
            return "ABORT: Critical risks detected - deployment not safe"
        elif failed_checks:
            return "CAUTION: Some checks failed - review required before deployment"
        else:
            return "PROCEED: All safety checks passed - deployment ready"
    
    def _generate_session_recommendations(self) -> List[str]:
        """
        Generate recommendations based on session performance
        """
        recommendations = []
        
        # Check if conflict patterns were learned
        state_agent = self.active_agents.get(AgentType.STATE_PERSISTENCE)
        if state_agent and len(state_agent.conflict_patterns) > 0:
            recommendations.append("Conflict patterns learned - future operations should be more efficient")
        
        # Check agent performance
        if len(self.active_agents) > 3:
            recommendations.append("Multiple agents activated - consider agent coordination optimization")
        
        return recommendations
    
    def _suggest_next_session_optimizations(self) -> List[str]:
        """
        Suggest optimizations for next session
        """
        optimizations = []
        
        # Based on this session's patterns
        optimizations.append("Pre-activate State Persistence Agent at session start")
        optimizations.append("Enable automatic conflict resolution by default")
        optimizations.append("Implement proactive deployment safety checks")
        
        return optimizations
    
    def _define_agent_capabilities(self) -> Dict[AgentType, AgentCapability]:
        """
        Define capabilities and activation triggers for each agent type
        """
        return {
            AgentType.STATE_PERSISTENCE: AgentCapability(
                agent_type=AgentType.STATE_PERSISTENCE,
                handles_operations=["file_write", "file_create", "directory_create", "git_operations"],
                handles_conflicts=[ConflictType.FILESYSTEM_PATH, ConflictType.PERMISSION_DENIED, ConflictType.DIRECTORY_MISSING],
                activation_triggers=[ActivationTrigger.SESSION_START, ActivationTrigger.FILE_OPERATION, ActivationTrigger.CONFLICT_DETECTED],
                priority_level=1,
                auto_activate=True
            ),
            AgentType.SMART_ORCHESTRATION: AgentCapability(
                agent_type=AgentType.SMART_ORCHESTRATION,
                handles_operations=["file_write", "directory_create"],
                handles_conflicts=[ConflictType.FILESYSTEM_PATH, ConflictType.DIRECTORY_MISSING, ConflictType.SIZE_LIMIT],
                activation_triggers=[ActivationTrigger.FILE_OPERATION, ActivationTrigger.CONFLICT_DETECTED],
                priority_level=2,
                auto_activate=True
            ),
            AgentType.PRODUCTION_DEPLOYMENT: AgentCapability(
                agent_type=AgentType.PRODUCTION_DEPLOYMENT,
                handles_operations=["deployment", "git_commit", "git_push", "build"],
                handles_conflicts=[],
                activation_triggers=[ActivationTrigger.DEPLOYMENT_REQUEST],
                priority_level=1,
                auto_activate=False
            )
        }
    
    def _initialize_core_agents(self):
        """
        Initialize core agents that should always be active
        """
        # Auto-activate State Persistence Agent
        self._ensure_agent_active(AgentType.STATE_PERSISTENCE)

# Convenience functions for immediate use

def smart_file_write(path: str, content: str) -> Dict[str, Any]:
    """
    Smart file write with full agent coordination
    """
    coordinator = AgentSystemCoordinator()
    return coordinator.process_operation_request("file_write", path=path, content=content)

def smart_deployment_check() -> Dict[str, Any]:
    """
    Smart deployment safety check
    """
    coordinator = AgentSystemCoordinator()
    return coordinator.activate_deployment_safety_check()

def handle_file_conflict(operation_type: str, path: str, error_message: str, **params) -> Dict[str, Any]:
    """
    Handle file operation conflict with agent coordination
    """
    coordinator = AgentSystemCoordinator()
    return coordinator.handle_file_operation_conflict(operation_type, path, error_message, **params)

if __name__ == "__main__":
    # Example usage - test the coordination system
    coordinator = AgentSystemCoordinator()
    
    # Test file operation with conflict handling
    result = smart_file_write("app/api/test-route/route.ts", "// Test API route content")
    print(f"File operation result: {result}")
    
    # Test deployment safety check
    deploy_check = smart_deployment_check()
    print(f"Deployment check: {deploy_check}")
    
    # Get session intelligence report
    session_report = coordinator.get_session_intelligence_report()
    print(f"Session report: {session_report}")
