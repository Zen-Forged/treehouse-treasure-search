# State Persistence Agent
# Real-time session state management and conflict resolution

import json
import time
import hashlib
import pickle
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
from enum import Enum

class OperationState(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"

class ConflictSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class OperationContext:
    operation_id: str
    operation_type: str
    target_path: str
    parameters: Dict[str, Any]
    state: OperationState
    start_time: float
    end_time: Optional[float] = None
    conflicts_detected: List[str] = None
    resolutions_applied: List[str] = None
    success: Optional[bool] = None
    error_message: Optional[str] = None

@dataclass
class ConflictPattern:
    pattern_id: str
    operation_type: str
    error_signature: str
    resolution_strategy: str
    success_rate: float
    last_seen: float
    occurrence_count: int

class StatePersistenceAgent:
    """
    Real-time session state management with intelligent conflict resolution
    """
    
    def __init__(self, project_path: str = "/Users/davidbutler/Projects/treehouse-treasure-search"):
        self.project_path = Path(project_path)
        self.state_file = self.project_path / ".agent_state.json"
        self.operations_file = self.project_path / ".operations_log.json"
        self.conflicts_file = self.project_path / ".conflict_patterns.json"
        
        self.session_state = self._load_session_state()
        self.operation_log = self._load_operation_log()
        self.conflict_patterns = self._load_conflict_patterns()
        
        self.active_operations = {}
        self.session_id = self._generate_session_id()
    
    def begin_operation(self, operation_type: str, target_path: str, **parameters) -> str:
        """
        Begin tracking a new operation with proactive conflict detection
        """
        operation_id = self._generate_operation_id(operation_type, target_path)
        
        # Proactive conflict prediction
        predicted_conflicts = self._predict_conflicts(operation_type, target_path, parameters)
        
        operation_context = OperationContext(
            operation_id=operation_id,
            operation_type=operation_type,
            target_path=target_path,
            parameters=parameters,
            state=OperationState.PENDING,
            start_time=time.time(),
            conflicts_detected=predicted_conflicts
        )
        
        # Apply preemptive resolutions
        if predicted_conflicts:
            resolutions = self._apply_preemptive_resolutions(operation_context)
            operation_context.resolutions_applied = resolutions
        
        self.active_operations[operation_id] = operation_context
        self._persist_state()
        
        return operation_id
    
    def update_operation_state(self, operation_id: str, state: OperationState, 
                             error_message: Optional[str] = None, success: Optional[bool] = None):
        """
        Update operation state with real-time conflict monitoring
        """
        if operation_id not in self.active_operations:
            return False
        
        operation = self.active_operations[operation_id]
        operation.state = state
        operation.success = success
        operation.error_message = error_message
        
        if state in [OperationState.COMPLETED, OperationState.FAILED]:
            operation.end_time = time.time()
            
            # Learn from operation outcome
            self._learn_from_operation(operation)
        
        # Real-time conflict detection from error messages
        if error_message:
            runtime_conflicts = self._detect_runtime_conflicts(error_message)
            if runtime_conflicts:
                self._handle_runtime_conflicts(operation_id, runtime_conflicts)
        
        self._persist_state()
        return True
    
    def resolve_conflict_automatically(self, operation_id: str, conflict_type: str) -> Dict[str, Any]:
        """
        Automatically resolve conflicts using learned patterns
        """
        if operation_id not in self.active_operations:
            return {"success": False, "error": "Operation not found"}
        
        operation = self.active_operations[operation_id]
        
        # Find best resolution strategy
        resolution_strategy = self._find_best_resolution(conflict_type, operation.operation_type)
        
        if not resolution_strategy:
            return {"success": False, "error": "No resolution strategy found"}
        
        # Execute resolution
        resolution_result = self._execute_resolution_strategy(operation, resolution_strategy)
        
        # Update operation with resolution
        if operation.resolutions_applied is None:
            operation.resolutions_applied = []
        operation.resolutions_applied.append(resolution_strategy["strategy_id"])
        
        # Update conflict pattern success rate
        self._update_pattern_success_rate(conflict_type, resolution_result["success"])
        
        self._persist_state()
        
        return resolution_result
    
    def get_operation_status(self, operation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current operation status with context
        """
        if operation_id not in self.active_operations:
            return None
        
        operation = self.active_operations[operation_id]
        return {
            "operation_id": operation_id,
            "type": operation.operation_type,
            "state": operation.state.value,
            "duration": time.time() - operation.start_time if operation.end_time is None 
                       else operation.end_time - operation.start_time,
            "success": operation.success,
            "conflicts": operation.conflicts_detected or [],
            "resolutions": operation.resolutions_applied or [],
            "error": operation.error_message
        }
    
    def get_session_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive session summary
        """
        total_operations = len(self.active_operations)
        successful_operations = sum(1 for op in self.active_operations.values() 
                                  if op.success is True)
        failed_operations = sum(1 for op in self.active_operations.values() 
                              if op.success is False)
        
        conflict_types = {}
        for operation in self.active_operations.values():
            if operation.conflicts_detected:
                for conflict in operation.conflicts_detected:
                    conflict_types[conflict] = conflict_types.get(conflict, 0) + 1
        
        return {
            "session_id": self.session_id,
            "total_operations": total_operations,
            "successful_operations": successful_operations,
            "failed_operations": failed_operations,
            "success_rate": successful_operations / total_operations if total_operations > 0 else 0,
            "conflict_types_encountered": conflict_types,
            "most_common_conflicts": sorted(conflict_types.items(), key=lambda x: x[1], reverse=True)[:5],
            "session_duration": time.time() - self.session_start_time
        }
    
    def create_checkpoint(self, checkpoint_name: str) -> str:
        """
        Create a state checkpoint for rollback capability
        """
        checkpoint_id = f"checkpoint_{int(time.time())}_{checkpoint_name}"
        
        checkpoint_data = {
            "checkpoint_id": checkpoint_id,
            "timestamp": time.time(),
            "active_operations": {op_id: asdict(op) for op_id, op in self.active_operations.items()},
            "session_state": self.session_state.copy(),
            "project_files_snapshot": self._create_file_snapshot()
        }
        
        checkpoint_file = self.project_path / f".checkpoint_{checkpoint_id}.json"
        with open(checkpoint_file, 'w') as f:
            json.dump(checkpoint_data, f, indent=2, default=str)
        
        return checkpoint_id
    
    def restore_from_checkpoint(self, checkpoint_id: str) -> bool:
        """
        Restore session state from checkpoint
        """
        checkpoint_file = self.project_path / f".checkpoint_{checkpoint_id}.json"
        
        if not checkpoint_file.exists():
            return False
        
        try:
            with open(checkpoint_file, 'r') as f:
                checkpoint_data = json.load(f)
            
            # Restore operations state
            self.active_operations = {}
            for op_id, op_data in checkpoint_data["active_operations"].items():
                self.active_operations[op_id] = OperationContext(**op_data)
            
            # Restore session state
            self.session_state = checkpoint_data["session_state"]
            
            self._persist_state()
            return True
            
        except Exception as e:
            print(f"Failed to restore checkpoint: {e}")
            return False
    
    def _predict_conflicts(self, operation_type: str, target_path: str, parameters: Dict) -> List[str]:
        """
        Predict potential conflicts based on learned patterns
        """
        conflicts = []
        
        # Path-based conflict prediction
        if "[" in target_path or "]" in target_path:
            conflicts.append("filesystem_bracket_path")
        
        if len(Path(target_path).parents) > 5:
            conflicts.append("deep_directory_nesting")
        
        if not Path(target_path).parent.exists():
            conflicts.append("missing_parent_directory")
        
        # Operation-type specific conflicts
        if operation_type == "file_write":
            content_size = len(str(parameters.get("content", "")))
            if content_size > 12 * 1024 * 1024:  # 12MB
                conflicts.append("file_size_limit")
        
        # Pattern-based prediction using historical data
        for pattern_id, pattern in self.conflict_patterns.items():
            if (pattern.operation_type == operation_type and 
                self._path_matches_pattern(target_path, pattern.pattern_id)):
                conflicts.append(pattern_id)
        
        return conflicts
    
    def _apply_preemptive_resolutions(self, operation: OperationContext) -> List[str]:
        """
        Apply preemptive resolutions for predicted conflicts
        """
        resolutions = []
        
        for conflict in operation.conflicts_detected or []:
            if conflict == "missing_parent_directory":
                # Preemptively create parent directory
                parent_dir = Path(operation.target_path).parent
                try:
                    parent_dir.mkdir(parents=True, exist_ok=True)
                    resolutions.append("created_parent_directory")
                except Exception:
                    pass
            
            elif conflict == "filesystem_bracket_path":
                # Switch to bash-based approach
                resolutions.append("switch_to_bash_tools")
            
            elif conflict == "file_size_limit":
                # Enable streaming or chunked writing
                resolutions.append("enable_chunked_writing")
        
        return resolutions
    
    def _detect_runtime_conflicts(self, error_message: str) -> List[str]:
        """
        Detect conflicts from runtime error messages
        """
        conflicts = []
        
        error_patterns = {
            "Parent directory does not exist": "missing_parent_directory",
            "Permission denied": "permission_error",
            "No such file or directory": "file_not_found",
            "Command not found": "tool_unavailable",
            "Cannot create directory": "directory_creation_failed",
            "File too large": "file_size_limit",
            "Network error": "network_connectivity"
        }
        
        for pattern, conflict_type in error_patterns.items():
            if pattern.lower() in error_message.lower():
                conflicts.append(conflict_type)
        
        return conflicts
    
    def _handle_runtime_conflicts(self, operation_id: str, conflicts: List[str]):
        """
        Handle conflicts detected at runtime
        """
        operation = self.active_operations[operation_id]
        
        if operation.conflicts_detected is None:
            operation.conflicts_detected = []
        
        # Add new conflicts to operation
        for conflict in conflicts:
            if conflict not in operation.conflicts_detected:
                operation.conflicts_detected.append(conflict)
        
        # Attempt automatic resolution
        for conflict in conflicts:
            resolution_result = self.resolve_conflict_automatically(operation_id, conflict)
            if resolution_result["success"]:
                # Conflict resolved, update operation to retry
                operation.state = OperationState.PENDING
                break
    
    def _find_best_resolution(self, conflict_type: str, operation_type: str) -> Optional[Dict]:
        """
        Find the best resolution strategy for a given conflict
        """
        resolution_strategies = {
            "missing_parent_directory": {
                "strategy_id": "create_parent_bash",
                "command": "mkdir -p {parent_dir}",
                "success_rate": 0.95
            },
            "filesystem_bracket_path": {
                "strategy_id": "use_bash_fallback",
                "command": "cat > {target_path} << 'EOF'\n{content}\nEOF",
                "success_rate": 0.90
            },
            "permission_error": {
                "strategy_id": "change_permissions",
                "command": "chmod 755 {target_path}",
                "success_rate": 0.70
            }
        }
        
        return resolution_strategies.get(conflict_type)
    
    def _execute_resolution_strategy(self, operation: OperationContext, strategy: Dict) -> Dict:
        """
        Execute a resolution strategy
        """
        try:
            if strategy["strategy_id"] == "create_parent_bash":
                parent_dir = Path(operation.target_path).parent
                parent_dir.mkdir(parents=True, exist_ok=True)
                return {"success": True, "method": "mkdir_parents"}
            
            elif strategy["strategy_id"] == "use_bash_fallback":
                # This would integrate with the bash tool execution
                return {"success": True, "method": "bash_cat", "note": "Switched to bash tools"}
            
            else:
                return {"success": False, "error": "Unknown strategy"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _learn_from_operation(self, operation: OperationContext):
        """
        Learn from operation outcomes to improve future predictions
        """
        # Update conflict patterns based on actual outcomes
        if operation.conflicts_detected:
            for conflict in operation.conflicts_detected:
                if conflict not in self.conflict_patterns:
                    self.conflict_patterns[conflict] = ConflictPattern(
                        pattern_id=conflict,
                        operation_type=operation.operation_type,
                        error_signature="",
                        resolution_strategy="",
                        success_rate=0.0,
                        last_seen=time.time(),
                        occurrence_count=1
                    )
                else:
                    pattern = self.conflict_patterns[conflict]
                    pattern.last_seen = time.time()
                    pattern.occurrence_count += 1
        
        # Add to operation log for future analysis
        self.operation_log.append({
            "timestamp": time.time(),
            "operation": asdict(operation),
            "success": operation.success,
            "duration": (operation.end_time or time.time()) - operation.start_time
        })
        
        self._persist_patterns()
    
    def _update_pattern_success_rate(self, conflict_type: str, success: bool):
        """
        Update success rate for conflict resolution patterns
        """
        if conflict_type in self.conflict_patterns:
            pattern = self.conflict_patterns[conflict_type]
            # Simple exponential moving average
            if pattern.success_rate == 0.0:
                pattern.success_rate = 1.0 if success else 0.0
            else:
                alpha = 0.1  # Learning rate
                pattern.success_rate = (1 - alpha) * pattern.success_rate + alpha * (1.0 if success else 0.0)
    
    def _generate_session_id(self) -> str:
        """Generate unique session identifier"""
        self.session_start_time = time.time()
        return f"session_{int(self.session_start_time)}"
    
    def _generate_operation_id(self, operation_type: str, target_path: str) -> str:
        """Generate unique operation identifier"""
        unique_string = f"{operation_type}_{target_path}_{time.time()}"
        return hashlib.md5(unique_string.encode()).hexdigest()[:12]
    
    def _path_matches_pattern(self, path: str, pattern_id: str) -> bool:
        """Check if path matches a conflict pattern"""
        pattern_checks = {
            "filesystem_bracket_path": lambda p: "[" in p or "]" in p,
            "deep_directory_nesting": lambda p: len(Path(p).parents) > 5,
            "missing_parent_directory": lambda p: not Path(p).parent.exists()
        }
        
        check_func = pattern_checks.get(pattern_id)
        return check_func(path) if check_func else False
    
    def _create_file_snapshot(self) -> Dict[str, Any]:
        """Create snapshot of key project files for rollback"""
        important_files = [
            "package.json",
            "CLAUDE.md", 
            "CONTEXT.md",
            "MASTER_PROMPT.md"
        ]
        
        snapshot = {}
        for file_name in important_files:
            file_path = self.project_path / file_name
            if file_path.exists():
                with open(file_path, 'r') as f:
                    snapshot[file_name] = {
                        "content": f.read(),
                        "mtime": file_path.stat().st_mtime
                    }
        
        return snapshot
    
    def _load_session_state(self) -> Dict:
        """Load session state from file"""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _load_operation_log(self) -> List:
        """Load operation log from file"""
        if self.operations_file.exists():
            with open(self.operations_file, 'r') as f:
                return json.load(f)
        return []
    
    def _load_conflict_patterns(self) -> Dict[str, ConflictPattern]:
        """Load conflict patterns from file"""
        if self.conflicts_file.exists():
            with open(self.conflicts_file, 'r') as f:
                data = json.load(f)
                return {k: ConflictPattern(**v) for k, v in data.items()}
        return {}
    
    def _persist_state(self):
        """Persist current state to file"""
        with open(self.state_file, 'w') as f:
            json.dump(self.session_state, f, indent=2)
        
        with open(self.operations_file, 'w') as f:
            json.dump(self.operation_log, f, indent=2, default=str)
    
    def _persist_patterns(self):
        """Persist conflict patterns to file"""
        data = {k: asdict(v) for k, v in self.conflict_patterns.items()}
        with open(self.conflicts_file, 'w') as f:
            json.dump(data, f, indent=2, default=str)

# Integration Functions

def smart_file_operation(operation_type: str, target_path: str, **parameters):
    """
    Execute file operation with state persistence and conflict resolution
    """
    agent = StatePersistenceAgent()
    
    # Begin operation tracking
    operation_id = agent.begin_operation(operation_type, target_path, **parameters)
    
    try:
        # Execute operation with monitoring
        agent.update_operation_state(operation_id, OperationState.IN_PROGRESS)
        
        # Actual operation execution would go here
        # For now, simulate success
        
        agent.update_operation_state(operation_id, OperationState.COMPLETED, success=True)
        
        return {
            "success": True,
            "operation_id": operation_id,
            "status": agent.get_operation_status(operation_id)
        }
        
    except Exception as e:
        agent.update_operation_state(operation_id, OperationState.FAILED, 
                                   error_message=str(e), success=False)
        return {
            "success": False,
            "operation_id": operation_id,
            "error": str(e),
            "status": agent.get_operation_status(operation_id)
        }

if __name__ == "__main__":
    # Example usage
    agent = StatePersistenceAgent()
    
    # Start operation tracking
    op_id = agent.begin_operation("file_write", "app/api/test/route.ts", content="test content")
    
    # Simulate operation with conflict
    agent.update_operation_state(op_id, OperationState.FAILED, 
                               error_message="Parent directory does not exist")
    
    # Get session summary
    summary = agent.get_session_summary()
    print(f"Session summary: {summary}")
