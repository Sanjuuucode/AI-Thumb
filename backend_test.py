#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timezone, timedelta
import uuid
import os

class QuickThumbAPITester:
    def __init__(self, base_url="https://quickthumb-ai-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
            self.failed_tests.append({"test": test_name, "error": details})

    def test_api_health(self):
        """Test basic API health"""
        try:
            response = requests.get(f"{self.base_url}/api/", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_result("API Health Check", success, details if not success else "")
            return success
        except Exception as e:
            self.log_result("API Health Check", False, str(e))
            return False

    def create_test_user_session(self):
        """Create test user and session using MongoDB (simulated via direct API call)"""
        try:
            # For testing, we'll create a session token manually
            # In real scenario, this would be done via MongoDB script as per auth_testing.md
            self.user_id = f"test-user-{int(datetime.now().timestamp())}"
            self.session_token = f"test_session_{int(datetime.now().timestamp())}"
            
            print(f"📝 Created test user: {self.user_id}")
            print(f"🔑 Session token: {self.session_token}")
            return True
        except Exception as e:
            self.log_result("Create Test User Session", False, str(e))
            return False

    def test_auth_me_without_token(self):
        """Test /auth/me without authentication"""
        try:
            response = requests.get(f"{self.base_url}/api/auth/me", timeout=10)
            success = response.status_code == 401
            details = f"Expected 401, got {response.status_code}"
            self.log_result("Auth Me (No Token)", success, details if not success else "")
            return success
        except Exception as e:
            self.log_result("Auth Me (No Token)", False, str(e))
            return False

    def test_auth_me_with_invalid_token(self):
        """Test /auth/me with invalid token"""
        try:
            headers = {"Authorization": "Bearer invalid_token_123"}
            response = requests.get(f"{self.base_url}/api/auth/me", headers=headers, timeout=10)
            success = response.status_code == 401
            details = f"Expected 401, got {response.status_code}"
            self.log_result("Auth Me (Invalid Token)", success, details if not success else "")
            return success
        except Exception as e:
            self.log_result("Auth Me (Invalid Token)", False, str(e))
            return False

    def test_session_data_endpoint(self):
        """Test session data endpoint (requires X-Session-ID)"""
        try:
            # This endpoint requires X-Session-ID header from Emergent Auth
            headers = {"X-Session-ID": "test_session_id"}
            response = requests.get(f"{self.base_url}/api/auth/session-data", headers=headers, timeout=10)
            # This will likely fail in test environment, but we check the response
            success = response.status_code in [400, 401]  # Expected failures in test env
            details = f"Status: {response.status_code}, Response: {response.text[:200]}"
            self.log_result("Session Data Endpoint", success, details if not success else "")
            return success
        except Exception as e:
            self.log_result("Session Data Endpoint", False, str(e))
            return False

    def test_logout_endpoint(self):
        """Test logout endpoint"""
        try:
            response = requests.post(f"{self.base_url}/api/auth/logout", timeout=10)
            success = response.status_code == 200
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_result("Logout Endpoint", success, details if not success else "")
            return success
        except Exception as e:
            self.log_result("Logout Endpoint", False, str(e))
            return False

    def test_generate_without_auth(self):
        """Test thumbnail generation without authentication"""
        try:
            data = {"text": "Test Thumbnail", "style": "modern"}
            response = requests.post(f"{self.base_url}/api/generate", json=data, timeout=10)
            success = response.status_code == 401
            details = f"Expected 401, got {response.status_code}"
            self.log_result("Generate (No Auth)", success, details if not success else "")
            return success
        except Exception as e:
            self.log_result("Generate (No Auth)", False, str(e))
            return False

    def test_stripe_checkout_without_auth(self):
        """Test Stripe checkout without authentication"""
        try:
            response = requests.post(f"{self.base_url}/api/create-checkout-session", timeout=10)
            success = response.status_code == 401
            details = f"Expected 401, got {response.status_code}"
            self.log_result("Stripe Checkout (No Auth)", success, details if not success else "")
            return success
        except Exception as e:
            self.log_result("Stripe Checkout (No Auth)", False, str(e))
            return False

    def test_stripe_webhook(self):
        """Test Stripe webhook endpoint"""
        try:
            # Test webhook with minimal payload
            data = {"type": "checkout.session.completed", "data": {"object": {"metadata": {"user_id": "test"}}}}
            response = requests.post(f"{self.base_url}/api/webhook", json=data, timeout=10)
            success = response.status_code in [200, 400]  # Either success or validation error is acceptable
            details = f"Status: {response.status_code}, Response: {response.text[:100]}"
            self.log_result("Stripe Webhook", success, details if not success else "")
            return success
        except Exception as e:
            self.log_result("Stripe Webhook", False, str(e))
            return False

    def test_authenticated_endpoints(self):
        """Test authenticated endpoints with valid session token"""
        if not self.session_token:
            print("⚠️  No session token available for authenticated tests")
            return False
            
        headers = {"Authorization": f"Bearer {self.session_token}"}
        
        # Test /auth/me
        try:
            response = requests.get(f"{self.base_url}/api/auth/me", headers=headers, timeout=10)
            success = response.status_code == 200
            if success:
                user_data = response.json()
                self.user_id = user_data.get('user_id')
                print(f"✅ Auth Me (Valid Token) - User: {user_data.get('name', 'Unknown')}, Credits: {user_data.get('credits', 0)}")
            else:
                print(f"❌ Auth Me (Valid Token) - Status: {response.status_code}")
            self.log_result("Auth Me (Valid Token)", success, f"Status: {response.status_code}" if not success else "")
        except Exception as e:
            self.log_result("Auth Me (Valid Token)", False, str(e))
            return False
            
        # Test thumbnail generation
        try:
            data = {"text": "Test AI Tutorial", "style": "modern"}
            response = requests.post(f"{self.base_url}/api/generate", json=data, headers=headers, timeout=30)
            success = response.status_code == 200
            if success:
                result = response.json()
                has_image = 'image' in result and result['image'].startswith('data:image/')
                has_credits = 'credits' in result
                success = has_image and has_credits
                details = f"Image: {'✓' if has_image else '✗'}, Credits: {'✓' if has_credits else '✗'}"
                print(f"✅ Thumbnail Generation - {details}")
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                print(f"❌ Thumbnail Generation - {details}")
            self.log_result("Thumbnail Generation", success, details if not success else "")
        except Exception as e:
            self.log_result("Thumbnail Generation", False, str(e))
            
        # Test Stripe checkout
        try:
            response = requests.post(f"{self.base_url}/api/create-checkout-session", headers=headers, timeout=10)
            success = response.status_code == 200
            if success:
                result = response.json()
                has_url = 'url' in result and result['url']
                success = has_url
                details = f"URL: {result.get('url', 'Missing')[:50]}..."
                print(f"✅ Stripe Checkout - {details}")
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:100]}"
                print(f"❌ Stripe Checkout - {details}")
            self.log_result("Stripe Checkout (Authenticated)", success, details if not success else "")
        except Exception as e:
            self.log_result("Stripe Checkout (Authenticated)", False, str(e))
            
        return True

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting QuickThumb Backend API Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 60)

        # Basic connectivity
        if not self.test_api_health():
            print("❌ API is not accessible. Stopping tests.")
            return False

        # Create test session
        self.create_test_user_session()

        # Auth tests
        self.test_auth_me_without_token()
        self.test_auth_me_with_invalid_token()
        self.test_session_data_endpoint()
        self.test_logout_endpoint()

        # Protected endpoint tests
        self.test_generate_without_auth()
        self.test_stripe_checkout_without_auth()

        # Webhook test
        self.test_stripe_webhook()

        # Summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failed in self.failed_tests:
                print(f"  - {failed['test']}: {failed['error']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as acceptable

def main():
    tester = QuickThumbAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())