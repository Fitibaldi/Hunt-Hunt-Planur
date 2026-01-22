"""
Test script to verify the joined sessions bug fix
Run this after starting the Flask app to check if the fix works
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def test_joined_sessions_workflow():
    """Test the complete workflow of joining and rejoining sessions"""
    
    print("=" * 60)
    print("Testing Joined Sessions Bug Fix")
    print("=" * 60)
    
    # Create two test sessions for testing
    session1 = requests.Session()
    session2 = requests.Session()
    
    print("\n1. Registering User A (Creator)...")
    response = session1.post(f"{BASE_URL}/api/register", json={
        "username": "test_creator",
        "email": "creator@test.com",
        "password": "password123"
    })
    print(f"   Status: {response.status_code}")
    
    print("\n2. Registering User B (Joiner)...")
    response = session2.post(f"{BASE_URL}/api/register", json={
        "username": "test_joiner",
        "email": "joiner@test.com",
        "password": "password123"
    })
    print(f"   Status: {response.status_code}")
    
    print("\n3. User A creates a session...")
    response = session1.post(f"{BASE_URL}/api/create_session", json={
        "session_name": "Test Session for Bug Fix"
    })
    data = response.json()
    if data.get('success'):
        session_code = data['session']['session_code']
        print(f"   ✓ Session created: {session_code}")
    else:
        print(f"   ✗ Failed: {data.get('message')}")
        return
    
    print("\n4. User B joins the session...")
    response = session2.post(f"{BASE_URL}/api/join_session", json={
        "session_code": session_code
    })
    data = response.json()
    print(f"   Status: {data.get('message')}")
    
    print("\n5. Checking User B's joined sessions...")
    response = session2.get(f"{BASE_URL}/api/get_joined_sessions")
    data = response.json()
    if data.get('success') and len(data.get('sessions', [])) > 0:
        print(f"   ✓ Found {len(data['sessions'])} joined session(s)")
        for s in data['sessions']:
            print(f"     - {s['session_name']} ({s['session_code']})")
            print(f"       Active: {s['user_is_active']}")
    else:
        print(f"   ✗ No joined sessions found!")
        print(f"   Response: {data}")
    
    print("\n6. User B leaves the session...")
    response = session2.post(f"{BASE_URL}/api/leave_session")
    data = response.json()
    print(f"   Status: {data.get('message')}")
    
    print("\n7. Checking User B's joined sessions after leaving...")
    response = session2.get(f"{BASE_URL}/api/get_joined_sessions")
    data = response.json()
    if data.get('success'):
        sessions = data.get('sessions', [])
        print(f"   Found {len(sessions)} session(s)")
        if len(sessions) > 0:
            print(f"   Note: Session still appears (expected if session is active)")
            for s in sessions:
                print(f"     - {s['session_name']}: Active={s['user_is_active']}")
    
    print("\n8. User B rejoins the session...")
    response = session2.post(f"{BASE_URL}/api/join_session", json={
        "session_code": session_code
    })
    data = response.json()
    print(f"   Status: {data.get('message')}")
    
    print("\n9. Checking User B's joined sessions after rejoining...")
    response = session2.get(f"{BASE_URL}/api/get_joined_sessions")
    data = response.json()
    if data.get('success') and len(data.get('sessions', [])) > 0:
        print(f"   ✓ Found {len(data['sessions'])} joined session(s)")
        for s in data['sessions']:
            print(f"     - {s['session_name']} ({s['session_code']})")
            print(f"       Active: {s['user_is_active']}")
            if s['user_is_active']:
                print(f"       ✓ User is active (rejoin successful!)")
            else:
                print(f"       ✗ User is not active (rejoin failed!)")
    else:
        print(f"   ✗ No joined sessions found after rejoin!")
        print(f"   Response: {data}")
    
    print("\n10. Cleaning up - ending session...")
    response = session1.post(f"{BASE_URL}/api/end_session", json={
        "session_code": session_code
    })
    data = response.json()
    print(f"   Status: {data.get('message')}")
    
    print("\n" + "=" * 60)
    print("Test Complete!")
    print("=" * 60)

if __name__ == "__main__":
    try:
        test_joined_sessions_workflow()
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: Could not connect to Flask server")
        print("  Make sure the Flask app is running on http://localhost:5000")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
