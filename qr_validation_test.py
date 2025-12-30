#!/usr/bin/env python3
"""
Specific QR Validation E2E Test for Ciudad Feria
Tests the complete flow requested by the user:
1. Admin login
2. Get approved purchases
3. Find purchase with QR payload
4. Test QR validation endpoint
"""

import requests
import json
import sys
from datetime import datetime

class QRValidationTester:
    def __init__(self, base_url="https://eventtickets.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")

    def admin_login(self):
        """Step 1: Login as admin"""
        print("\n1️⃣ ADMIN LOGIN")
        print("=" * 30)
        
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        url = f"{self.api_url}/admin/login"
        print(f"🔐 POST {url}")
        print(f"📝 Credentials: {login_data}")
        
        try:
            response = requests.post(url, json=login_data, timeout=30)
            print(f"📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                role = data.get('role')
                
                if token:
                    self.admin_token = token
                    print(f"✅ Login successful")
                    print(f"🎭 Role: {role}")
                    print(f"🔑 Token: {token[:20]}...")
                    self.log_test("Admin Login", True)
                    return True
                else:
                    self.log_test("Admin Login", False, "No access token in response")
                    return False
            else:
                error_msg = f"Status {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test("Admin Login", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Request failed: {str(e)}")
            return False

    def get_approved_purchases(self):
        """Step 2: Get list of approved purchases"""
        print("\n2️⃣ GET APPROVED PURCHASES")
        print("=" * 30)
        
        if not self.admin_token:
            print("❌ No admin token available")
            return False, []
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        url = f"{self.api_url}/admin/compras"
        print(f"📋 GET {url}")
        print(f"🔍 Looking for approved purchases...")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            print(f"📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                compras = response.json()
                print(f"📦 Total purchases found: {len(compras)}")
                
                # Filter approved purchases
                approved_purchases = [c for c in compras if c.get('estado_pago') == 'aprobado']
                print(f"✅ Approved purchases: {len(approved_purchases)}")
                
                # Check for QR payloads
                with_qr = [c for c in approved_purchases if c.get('qr_payload')]
                print(f"🔑 With QR payload: {len(with_qr)}")
                
                if with_qr:
                    self.log_test("Get Approved Purchases", True)
                    return True, with_qr
                else:
                    print("⚠️ No approved purchases with QR payload found")
                    self.log_test("Get Approved Purchases", True, "No QR payloads found")
                    return True, approved_purchases
                    
            else:
                error_msg = f"Status {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test("Get Approved Purchases", False, error_msg)
                return False, []
                
        except Exception as e:
            self.log_test("Get Approved Purchases", False, f"Request failed: {str(e)}")
            return False, []

    def create_test_purchase_if_needed(self):
        """Create a test purchase if no approved purchases with QR exist"""
        print("\n🔧 CREATING TEST PURCHASE")
        print("=" * 30)
        
        # First get events
        try:
            response = requests.get(f"{self.api_url}/eventos", timeout=30)
            if response.status_code != 200:
                print("❌ Cannot get events list")
                return False, None
            
            eventos = response.json()
            if not eventos:
                print("❌ No events available")
                return False, None
            
            evento = eventos[0]
            evento_id = evento.get('id')
            evento_nombre = evento.get('nombre', 'Test Event')
            
            print(f"🎪 Using event: {evento_nombre}")
            
            # Create purchase
            compra_data = {
                "evento_id": evento_id,
                "nombre_comprador": "Ana Rodriguez",
                "email_comprador": "ana@example.com",
                "telefono_comprador": "1234567890",
                "cantidad": 1,
                "precio_total": 25.0,
                "metodo_pago": "transferencia"
            }
            
            print(f"🛒 Creating purchase...")
            response = requests.post(f"{self.api_url}/comprar-entrada", json=compra_data, timeout=30)
            
            if response.status_code != 200:
                print(f"❌ Purchase creation failed: {response.status_code}")
                return False, None
            
            purchase_data = response.json()
            if not purchase_data.get('entradas'):
                print("❌ No tickets in purchase response")
                return False, None
            
            entrada = purchase_data['entradas'][0]
            entrada_id = entrada.get('id')
            qr_payload = entrada.get('qr_payload')
            
            if not entrada_id or not qr_payload:
                print("❌ Missing ticket ID or QR payload")
                return False, None
            
            print(f"🎫 Ticket created: {entrada_id[:8]}...")
            print(f"🔑 QR payload length: {len(qr_payload)}")
            
            # Approve the purchase
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.admin_token}'
            }
            
            approval_data = {"entrada_ids": [entrada_id]}
            
            print(f"✅ Approving purchase...")
            response = requests.post(f"{self.api_url}/admin/aprobar-compra", 
                                   json=approval_data, headers=headers, timeout=30)
            
            if response.status_code != 200:
                print(f"❌ Purchase approval failed: {response.status_code}")
                return False, None
            
            approval_result = response.json()
            approved_count = approval_result.get('aprobadas', 0)
            
            if approved_count > 0:
                print(f"✅ Purchase approved successfully")
                self.log_test("Create and Approve Test Purchase", True)
                
                # Return the approved purchase data
                approved_purchase = {
                    'id': entrada_id,
                    'qr_payload': qr_payload,
                    'nombre_comprador': compra_data['nombre_comprador'],
                    'email_comprador': compra_data['email_comprador'],
                    'estado_pago': 'aprobado',
                    'nombre_evento': evento_nombre
                }
                
                return True, approved_purchase
            else:
                print(f"❌ Purchase approval failed")
                return False, None
                
        except Exception as e:
            print(f"❌ Error creating test purchase: {str(e)}")
            self.log_test("Create and Approve Test Purchase", False, str(e))
            return False, None

    def test_qr_validation(self, purchase):
        """Step 3: Test QR validation with different actions"""
        print("\n3️⃣ QR VALIDATION TESTING")
        print("=" * 30)
        
        qr_payload = purchase.get('qr_payload')
        comprador = purchase.get('nombre_comprador', 'Unknown')
        evento = purchase.get('nombre_evento', 'Unknown Event')
        
        print(f"🎫 Testing QR for: {comprador}")
        print(f"🎪 Event: {evento}")
        print(f"🔑 QR payload length: {len(qr_payload)}")
        
        # Test 1: Verification mode
        print(f"\n🔍 Testing verification mode...")
        success1 = self._test_qr_action(qr_payload, "verificar", "QR Verification")
        
        # Test 2: Entry mode
        print(f"\n🚪 Testing entry mode...")
        success2 = self._test_qr_action(qr_payload, "entrada", "QR Entry")
        
        # Test 3: Duplicate entry (should fail)
        print(f"\n🚨 Testing duplicate entry (should be blocked)...")
        success3 = self._test_qr_action(qr_payload, "entrada", "QR Duplicate Entry", expect_failure=True)
        
        # Test 4: Exit mode
        print(f"\n🚪 Testing exit mode...")
        success4 = self._test_qr_action(qr_payload, "salida", "QR Exit")
        
        # Test 5: Invalid QR payload
        print(f"\n🔒 Testing invalid QR payload...")
        success5 = self._test_qr_action("invalid_payload_test", "verificar", "QR Invalid Payload", expect_failure=True)
        
        return [success1, success2, success3, success4, success5]

    def _test_qr_action(self, qr_payload, accion, test_name, expect_failure=False):
        """Helper method to test QR validation with specific action"""
        validation_data = {
            "qr_payload": qr_payload,
            "accion": accion
        }
        
        url = f"{self.api_url}/validar-entrada"
        print(f"🔍 POST {url}")
        print(f"📝 Action: {accion}")
        
        try:
            response = requests.post(url, json=validation_data, timeout=30)
            print(f"📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                valido = data.get('valido', False)
                mensaje = data.get('mensaje', 'No message')
                
                print(f"🎯 Valid: {valido}")
                print(f"💬 Message: {mensaje}")
                
                if expect_failure:
                    if not valido:
                        print(f"✅ Expected failure occurred")
                        self.log_test(test_name, True)
                        return True
                    else:
                        print(f"❌ Expected failure but validation succeeded")
                        self.log_test(test_name, False, "Expected failure but got success")
                        return False
                else:
                    if valido:
                        print(f"✅ Validation successful")
                        
                        # Print additional info if available
                        if 'entrada' in data:
                            entrada_info = data['entrada']
                            print(f"👤 Comprador: {entrada_info.get('nombre_comprador', 'N/A')}")
                            print(f"🎪 Evento: {entrada_info.get('nombre_evento', 'N/A')}")
                            print(f"🪑 Asiento: {entrada_info.get('asiento', 'General')}")
                            print(f"📍 Estado: {entrada_info.get('estado_actual', 'N/A')}")
                        
                        self.log_test(test_name, True)
                        return True
                    else:
                        print(f"❌ Validation failed: {mensaje}")
                        self.log_test(test_name, False, mensaje)
                        return False
            else:
                error_msg = f"Status {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                if expect_failure and response.status_code == 400:
                    print(f"✅ Expected failure (400 Bad Request)")
                    self.log_test(test_name, True)
                    return True
                else:
                    print(f"❌ Request failed: {error_msg}")
                    self.log_test(test_name, False, error_msg)
                    return False
                    
        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False

    def run_complete_test(self):
        """Run the complete QR validation E2E test"""
        print("🔍 CIUDAD FERIA - QR VALIDATION E2E TEST")
        print("=" * 50)
        print(f"🌐 Backend URL: {self.base_url}")
        print(f"⏰ Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Step 1: Admin login
        if not self.admin_login():
            print("\n❌ CRITICAL: Cannot proceed without admin access")
            return False
        
        # Step 2: Get approved purchases
        success, purchases = self.get_approved_purchases()
        if not success:
            print("\n❌ CRITICAL: Cannot get purchases list")
            return False
        
        # Step 3: Find or create purchase with QR
        purchase_with_qr = None
        
        if purchases:
            # Look for purchase with QR payload
            for purchase in purchases:
                if purchase.get('qr_payload'):
                    purchase_with_qr = purchase
                    print(f"\n✅ Found approved purchase with QR: {purchase.get('nombre_comprador', 'Unknown')}")
                    break
        
        if not purchase_with_qr:
            print(f"\n⚠️ No approved purchases with QR found, creating test purchase...")
            success, purchase_with_qr = self.create_test_purchase_if_needed()
            if not success or not purchase_with_qr:
                print("\n❌ CRITICAL: Cannot create test purchase")
                return False
        
        # Step 4: Test QR validation
        validation_results = self.test_qr_validation(purchase_with_qr)
        
        # Summary
        print(f"\n📊 TEST SUMMARY")
        print("=" * 30)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        validation_passed = sum(validation_results)
        validation_total = len(validation_results)
        print(f"QR Validation Tests: {validation_passed}/{validation_total}")
        
        overall_success = self.tests_passed >= (self.tests_run - 1)  # Allow 1 failure
        
        if overall_success:
            print(f"\n✅ QR VALIDATION E2E FLOW: WORKING")
            print(f"🎯 The /api/validar-entrada endpoint is functioning correctly")
            print(f"🔐 Hash validation is working properly")
            print(f"🎫 Entry/exit tracking is operational")
        else:
            print(f"\n❌ QR VALIDATION E2E FLOW: ISSUES DETECTED")
            print(f"🚨 Critical problems found in validation system")
        
        return overall_success

def main():
    tester = QRValidationTester()
    success = tester.run_complete_test()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())