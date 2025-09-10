#!/usr/bin/env python3
"""
Simple test script for the Spicy Todo API
Run this to test basic API functionality
"""

import requests
import json
import time

API_BASE_URL = "http://localhost:8000"

def test_api():
    print("🧪 Testing Spicy Todo API...")
    print("=" * 50)
    
    try:
        # Test 1: Health check
        print("1. Testing health check...")
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return
        
        # Test 2: Get all todos
        print("\n2. Testing get all todos...")
        response = requests.get(f"{API_BASE_URL}/api/todos")
        if response.status_code == 200:
            todos = response.json()
            print(f"✅ Retrieved {len(todos)} todos")
            if todos:
                print(f"   First todo: {todos[0]['text'][:50]}...")
        else:
            print(f"❌ Get todos failed: {response.status_code}")
            return
        
        # Test 3: Create a new todo
        print("\n3. Testing create todo...")
        new_todo = {
            "text": "Test todo from API test script",
            "priority": "high",
            "completed": False
        }
        response = requests.post(f"{API_BASE_URL}/api/todos", json=new_todo)
        if response.status_code == 200:
            created_todo = response.json()
            print("✅ Todo created successfully")
            print(f"   ID: {created_todo['id']}")
            todo_id = created_todo['id']
        else:
            print(f"❌ Create todo failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
        
        # Test 4: Get specific todo
        print("\n4. Testing get specific todo...")
        response = requests.get(f"{API_BASE_URL}/api/todos/{todo_id}")
        if response.status_code == 200:
            todo = response.json()
            print("✅ Retrieved specific todo")
            print(f"   Text: {todo['text']}")
        else:
            print(f"❌ Get specific todo failed: {response.status_code}")
        
        # Test 5: Update todo
        print("\n5. Testing update todo...")
        update_data = {"completed": True}
        response = requests.put(f"{API_BASE_URL}/api/todos/{todo_id}", json=update_data)
        if response.status_code == 200:
            updated_todo = response.json()
            print("✅ Todo updated successfully")
            print(f"   Completed: {updated_todo['completed']}")
        else:
            print(f"❌ Update todo failed: {response.status_code}")
        
        # Test 6: Toggle todo
        print("\n6. Testing toggle todo...")
        response = requests.patch(f"{API_BASE_URL}/api/todos/{todo_id}/toggle")
        if response.status_code == 200:
            toggled_todo = response.json()
            print("✅ Todo toggled successfully")
            print(f"   Completed: {toggled_todo['completed']}")
        else:
            print(f"❌ Toggle todo failed: {response.status_code}")
        
        # Test 7: Search todos
        print("\n7. Testing search todos...")
        response = requests.get(f"{API_BASE_URL}/api/todos?search=test")
        if response.status_code == 200:
            search_results = response.json()
            print(f"✅ Search completed: {len(search_results)} results")
        else:
            print(f"❌ Search failed: {response.status_code}")
        
        # Test 8: Get statistics
        print("\n8. Testing get statistics...")
        response = requests.get(f"{API_BASE_URL}/api/todos/stats/summary")
        if response.status_code == 200:
            stats = response.json()
            print("✅ Statistics retrieved")
            print(f"   Total: {stats['total']}, Active: {stats['active']}, Completed: {stats['completed']}")
        else:
            print(f"❌ Get statistics failed: {response.status_code}")
        
        # Test 9: Delete todo
        print("\n9. Testing delete todo...")
        response = requests.delete(f"{API_BASE_URL}/api/todos/{todo_id}")
        if response.status_code == 200:
            print("✅ Todo deleted successfully")
        else:
            print(f"❌ Delete todo failed: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("🎉 All tests completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API server.")
        print("   Make sure the server is running on http://localhost:8000")
        print("   Run: python main.py")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_api()
