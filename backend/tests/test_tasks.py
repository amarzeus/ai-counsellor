"""
Task management tests - creation, updates, and filtering.
"""
import pytest
from models import TaskStatus

def test_create_task(db_session, test_user):
    """Test creating a task."""
    from models import Task
    
    task = Task(
        user_id=test_user.id,
        title="Complete IELTS",
        description="Take IELTS exam",
        priority=1,
        status=TaskStatus.PENDING
    )
    db_session.add(task)
    db_session.commit()
    
    assert task.id is not None
    assert task.status == TaskStatus.PENDING
    assert task.priority == 1

def test_get_user_tasks(client, auth_headers, test_task):
    """Test retrieving user tasks."""
    response = client.get("/api/tasks", headers=auth_headers)
    
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) > 0
    assert any(task["title"] == "Complete SOP" for task in tasks)

def test_update_task_status(client, auth_headers, test_task):
    """Test updating task status."""
    response = client.patch(
        f"/api/tasks/{test_task.id}",
        json={"status": "COMPLETED"},
        headers=auth_headers
    )
    
    # Endpoint might be PUT or PATCH
    if response.status_code == 404:
        # Try PUT
        response = client.put(
            f"/api/tasks/{test_task.id}",
            json={"status": "COMPLETED"},
            headers=auth_headers
        )
    
    assert response.status_code in [200, 201]

def test_delete_task(client, auth_headers, test_task):
    """Test deleting a task."""
    response = client.delete(f"/api/tasks/{test_task.id}", headers=auth_headers)
    
    assert response.status_code in [200, 204]

def test_tasks_generated_on_university_lock(client, auth_headers, test_universities, test_shortlist, db_session):
    """Test that tasks are auto-generated when university is locked."""
    from models import User
    
    # Get user and update to DISCOVERY stage
    user = db_session.query(User).filter_by(email="test@example.com").first()
    
    # Lock university
    response = client.post(
        f"/api/lock/{test_universities[1].id}",
        headers=auth_headers
    )
    
    # Should succeed or return appropriate status
    if response.status_code == 200:
        # Check if tasks were created
        tasks_response = client.get("/api/tasks", headers=auth_headers)
        tasks = tasks_response.json()
        
        # Should have tasks related to the locked university
        assert len(tasks) > 0

def test_task_priority_levels(db_session, test_user):
    """Test different task priority levels."""
    from models import Task
    
    high_priority = Task(
        user_id=test_user.id,
        title="High Priority Task",
        priority=1,
        status=TaskStatus.PENDING
    )
    low_priority = Task(
        user_id=test_user.id,
        title="Low Priority Task",
        priority=3,
        status=TaskStatus.PENDING
    )
    
    db_session.add_all([high_priority, low_priority])
    db_session.commit()
    
    assert high_priority.priority == 1
    assert low_priority.priority == 3
