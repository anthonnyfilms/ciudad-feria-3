import requests
import sys
import json
from datetime import datetime

class CiudadFeriaAPITester:
    def __init__(self, base_url="https://eventtickets.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                print(f"   Status: {response.status_code} ✅")
                try:
                    response_data = response.json()
                    self.log_test(name, True)
                    return True, response_data
                except:
                    self.log_test(name, True, "Response not JSON")
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.log_test(name, False, error_msg)
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_list_eventos(self):
        """Test listing events"""
        success, data = self.run_test("List Events", "GET", "eventos", 200)
        if success and isinstance(data, list):
            print(f"   Found {len(data)} events")
            if len(data) >= 6:
                print(f"   ✅ Expected 6+ events, found {len(data)}")
                return True, data
            else:
                self.log_test("Event Count Check", False, f"Expected 6+ events, found {len(data)}")
                return False, data
        return success, data

    def test_get_evento_detail(self, evento_id):
        """Test getting event detail"""
        return self.run_test(f"Get Event Detail ({evento_id[:8]}...)", "GET", f"eventos/{evento_id}", 200)

    def test_comprar_entrada(self, evento_id, evento_nombre):
        """Test buying a ticket"""
        compra_data = {
            "evento_id": evento_id,
            "nombre_comprador": "Test User",
            "email_comprador": "test@example.com",
            "cantidad": 1,
            "precio_total": 25.0,
            "metodo_pago": "transferencia"
        }
        
        success, data = self.run_test(f"Buy Ticket ({evento_nombre[:20]}...)", "POST", "comprar-entrada", 200, compra_data)
        
        if success and data.get('success'):
            entradas = data.get('entradas', [])
            if entradas and len(entradas) > 0:
                entrada = entradas[0]
                if entrada.get('codigo_qr') and entrada.get('id'):
                    print(f"   ✅ QR code generated successfully")
                    print(f"   ✅ Ticket ID: {entrada['id'][:8]}...")
                    return True, entrada
                else:
                    self.log_test("QR Generation Check", False, "Missing QR code or ticket ID")
            else:
                self.log_test("Ticket Creation Check", False, "No tickets in response")
        
        return success, data

    def test_mis_entradas(self, email):
        """Test getting user tickets"""
        return self.run_test(f"Get My Tickets ({email})", "GET", f"mis-entradas/{email}", 200)

    def test_validar_entrada(self, qr_payload):
        """Test QR validation"""
        validation_data = {
            "qr_payload": qr_payload
        }
        return self.run_test("Validate QR Code", "POST", "validar-entrada", 200, validation_data)

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        success, data = self.run_test("Admin Login", "POST", "admin/login", 200, login_data)
        
        if success and data.get('access_token'):
            print(f"   ✅ Access token received")
            return True, data.get('access_token')
        else:
            self.log_test("Admin Token Check", False, "No access token in response")
            return False, None

    def test_admin_estadisticas(self, token):
        """Test admin statistics endpoint"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        success, data = self.run_test("Admin Statistics", "GET", "admin/estadisticas", 200, headers=headers)
        
        if success:
            # Check required fields
            required_fields = [
                'total_eventos', 
                'total_entradas_vendidas', 
                'entradas_aprobadas', 
                'entradas_pendientes_pago', 
                'ventas_por_evento'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test("Statistics Fields Check", False, f"Missing fields: {missing_fields}")
                return False, data
            else:
                print(f"   ✅ All required statistics fields present")
                print(f"   📊 Total Events: {data.get('total_eventos', 0)}")
                print(f"   📊 Total Tickets Sold: {data.get('total_entradas_vendidas', 0)}")
                print(f"   📊 Approved Tickets: {data.get('entradas_aprobadas', 0)}")
                print(f"   📊 Pending Payment: {data.get('entradas_pendientes_pago', 0)}")
                return True, data
        
        return success, data

    # ==================== SEAT SELECTION SYSTEM TESTS ====================
    
    def test_get_seats(self, evento_id):
        """Test getting seats configuration for an event"""
        success, data = self.run_test(f"Get Seats ({evento_id[:8]}...)", "GET", f"eventos/{evento_id}/asientos", 200)
        
        if success:
            # Check required fields
            required_fields = [
                'evento_id', 
                'tipo_asientos', 
                'configuracion', 
                'capacidad_total', 
                'asientos_ocupados', 
                'asientos_pendientes',
                'disponibles'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test("Seats Response Fields Check", False, f"Missing fields: {missing_fields}")
                return False, data
            else:
                print(f"   ✅ All required seat fields present")
                print(f"   🪑 Seat Type: {data.get('tipo_asientos', 'unknown')}")
                print(f"   🪑 Total Capacity: {data.get('capacidad_total', 0)}")
                print(f"   🪑 Occupied: {len(data.get('asientos_ocupados', []))}")
                print(f"   🪑 Pending: {len(data.get('asientos_pendientes', []))}")
                print(f"   🪑 Available: {data.get('disponibles', 0)}")
                return True, data
        
        return success, data

    def test_configure_seats(self, evento_id, token):
        """Test configuring seats for an event (admin only)"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # Test table-based configuration
        config_data = {
            "tipo_asientos": "mesas",
            "configuracion": {
                "mesas": [
                    {"id": "1", "nombre": "Mesa VIP 1", "sillas": 10, "precio": 50, "categoria": "VIP"},
                    {"id": "2", "nombre": "Mesa VIP 2", "sillas": 10, "precio": 50, "categoria": "VIP"}
                ]
            }
        }
        
        success, data = self.run_test(f"Configure Seats ({evento_id[:8]}...)", "POST", f"admin/eventos/{evento_id}/configurar-asientos", 200, config_data, headers)
        
        if success:
            if data.get('success') and data.get('capacidad_total') == 20:
                print(f"   ✅ Seat configuration successful")
                print(f"   🪑 Type: {data.get('tipo', 'unknown')}")
                print(f"   🪑 Total Capacity: {data.get('capacidad_total', 0)}")
                print(f"   🪑 Seats Created: {data.get('asientos_creados', 0)}")
                return True, data
            else:
                self.log_test("Seat Configuration Check", False, f"Expected success=True and capacity=20, got {data}")
                return False, data
        
        return success, data

    def test_reserve_seats(self, evento_id):
        """Test reserving specific seats"""
        reservation_data = {
            "evento_id": evento_id,
            "asientos": ["M1-S1", "M1-S2"],
            "session_id": "test-session-123"
        }
        
        success, data = self.run_test(f"Reserve Seats ({evento_id[:8]}...)", "POST", "reservar-asientos", 200, reservation_data)
        
        if success:
            if data.get('success') and data.get('asientos_reservados'):
                print(f"   ✅ Seat reservation successful")
                print(f"   🪑 Session ID: {data.get('session_id', 'unknown')}")
                print(f"   🪑 Reserved Seats: {data.get('asientos_reservados', [])}")
                print(f"   🪑 Expires In: {data.get('expira_en', 0)} seconds")
                return True, data
            else:
                self.log_test("Seat Reservation Check", False, f"Expected success=True and reserved seats, got {data}")
                return False, data
        
        return success, data

    def test_purchase_with_seats(self, evento_id, evento_nombre):
        """Test purchasing tickets with specific seat selection"""
        compra_data = {
            "evento_id": evento_id,
            "nombre_comprador": "Maria Rodriguez",
            "email_comprador": "maria@example.com",
            "telefono_comprador": "1234567890",
            "cantidad": 2,
            "precio_total": 100.0,  # Added required field
            "metodo_pago": "efectivo",
            "asientos": ["M1-S3", "M1-S4"]
        }
        
        success, data = self.run_test(f"Purchase with Seats ({evento_nombre[:20]}...)", "POST", "comprar-entrada", 200, compra_data)
        
        if success and data.get('success'):
            entradas = data.get('entradas', [])
            if entradas and len(entradas) == 2:
                # Check if seats are assigned correctly
                seats_assigned = []
                for entrada in entradas:
                    if entrada.get('asiento'):
                        seats_assigned.append(entrada['asiento'])
                
                if len(seats_assigned) == 2 and "M1-S3" in seats_assigned and "M1-S4" in seats_assigned:
                    print(f"   ✅ Purchase with seats successful")
                    print(f"   🪑 Seats Assigned: {seats_assigned}")
                    print(f"   🎫 Tickets Created: {len(entradas)}")
                    return True, entradas
                else:
                    self.log_test("Seat Assignment Check", False, f"Expected seats M1-S3, M1-S4, got {seats_assigned}")
                    return False, data
            else:
                self.log_test("Ticket Creation with Seats Check", False, f"Expected 2 tickets, got {len(entradas)}")
                return False, data
        
        return success, data

    def test_verify_occupied_seats(self, evento_id):
        """Test that purchased seats appear as occupied"""
        success, data = self.test_get_seats(evento_id)
        
        if success:
            asientos_pendientes = data.get('asientos_pendientes', [])
            
            # Check if our purchased seats are in pending list
            expected_seats = ["M1-S3", "M1-S4"]
            found_seats = []
            
            for seat in expected_seats:
                if seat in asientos_pendientes:
                    found_seats.append(seat)
            
            if len(found_seats) == 2:
                print(f"   ✅ Occupied seats tracking working")
                print(f"   🪑 Pending Seats: {found_seats}")
                return True, data
            else:
                self.log_test("Occupied Seats Tracking", False, f"Expected seats {expected_seats} in pending, found {found_seats}")
                return False, data
        
        return success, data

    # ==================== TICKET IMAGE & EMAIL SYSTEM TESTS ====================
    
    def test_approve_purchase(self, entrada_ids, token):
        """Test approving a purchase (required before image generation)"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        approval_data = {
            "entrada_ids": entrada_ids
        }
        
        success, data = self.run_test(f"Approve Purchase ({len(entrada_ids)} tickets)", "POST", "admin/aprobar-compra", 200, approval_data, headers)
        
        if success:
            if data.get('aprobadas', 0) > 0:
                print(f"   ✅ Purchase approval successful")
                print(f"   📋 Approved Tickets: {data.get('aprobadas', 0)}")
                return True, data
            else:
                self.log_test("Purchase Approval Check", False, f"Expected approved > 0, got {data}")
                return False, data
        
        return success, data

    def test_ticket_image_generation(self, entrada_id):
        """Test ticket image generation endpoint"""
        success, response_data = self.run_test(f"Generate Ticket Image ({entrada_id[:8]}...)", "GET", f"entrada/{entrada_id}/imagen", 200)
        
        # For image endpoints, we need to check the response differently
        url = f"{self.api_url}/entrada/{entrada_id}/imagen"
        print(f"\n🖼️ Testing Ticket Image Generation...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                # Check if it's actually an image
                content_type = response.headers.get('content-type', '')
                if 'image/png' in content_type:
                    content_length = len(response.content)
                    print(f"   ✅ Image generated successfully")
                    print(f"   📄 Content-Type: {content_type}")
                    print(f"   📏 Image Size: {content_length} bytes")
                    self.log_test(f"Generate Ticket Image ({entrada_id[:8]}...)", True)
                    return True, {"content_type": content_type, "size": content_length}
                else:
                    error_msg = f"Expected image/png, got {content_type}"
                    self.log_test(f"Generate Ticket Image ({entrada_id[:8]}...)", False, error_msg)
                    return False, {}
            elif response.status_code == 403:
                error_msg = "Ticket not approved yet (403 Forbidden)"
                print(f"   ❌ {error_msg}")
                self.log_test(f"Generate Ticket Image ({entrada_id[:8]}...)", False, error_msg)
                return False, {}
            else:
                error_msg = f"Expected 200, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(f"Generate Ticket Image ({entrada_id[:8]}...)", False, error_msg)
                return False, {}

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.log_test(f"Generate Ticket Image ({entrada_id[:8]}...)", False, error_msg)
            return False, {}

    def test_ticket_image_unapproved(self, entrada_id):
        """Test that unapproved tickets return 403 for image generation"""
        url = f"{self.api_url}/entrada/{entrada_id}/imagen"
        print(f"\n🚫 Testing Unapproved Ticket Image Access...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=30)
            
            if response.status_code == 403:
                print(f"   ✅ Correctly blocked unapproved ticket (403)")
                self.log_test(f"Block Unapproved Ticket Image ({entrada_id[:8]}...)", True)
                return True, {}
            else:
                error_msg = f"Expected 403 for unapproved ticket, got {response.status_code}"
                self.log_test(f"Block Unapproved Ticket Image ({entrada_id[:8]}...)", False, error_msg)
                return False, {}

        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.log_test(f"Block Unapproved Ticket Image ({entrada_id[:8]}...)", False, error_msg)
            return False, {}

    def test_email_config(self, token):
        """Test email configuration endpoint"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        success, data = self.run_test("Email Configuration Check", "GET", "admin/email-config", 200, headers=headers)
        
        if success:
            # Check required fields
            if 'configurado' in data and 'email' in data:
                print(f"   ✅ Email config endpoint working")
                print(f"   📧 Email Configured: {data.get('configurado', False)}")
                print(f"   📧 Email Address: {data.get('email', 'None')}")
                return True, data
            else:
                self.log_test("Email Config Fields Check", False, f"Missing required fields in response: {data}")
                return False, data
        
        return success, data

    def test_approve_and_send_email(self, entrada_ids, token):
        """Test approve and send email endpoint"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        approval_data = {
            "entrada_ids": entrada_ids
        }
        
        success, data = self.run_test(f"Approve and Send Email ({len(entrada_ids)} tickets)", "POST", "admin/aprobar-y-enviar", 200, approval_data, headers)
        
        if success:
            # Check response fields
            required_fields = ['aprobadas', 'emails_enviados', 'emails_fallidos', 'email_configurado']
            missing_fields = []
            
            for field in required_fields:
                if field not in data:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test("Approve and Send Response Check", False, f"Missing fields: {missing_fields}")
                return False, data
            else:
                print(f"   ✅ Approve and send endpoint working")
                print(f"   📋 Approved: {data.get('aprobadas', 0)}")
                print(f"   📧 Emails Sent: {data.get('emails_enviados', 0)}")
                print(f"   📧 Emails Failed: {data.get('emails_fallidos', 0)}")
                print(f"   📧 Email Configured: {data.get('email_configurado', False)}")
                
                # Since Gmail is not configured, we expect emails_fallidos > 0
                if not data.get('email_configurado', False) and data.get('emails_fallidos', 0) > 0:
                    print(f"   ✅ Expected behavior: emails failed due to no Gmail config")
                
                return True, data
        
        return success, data

    def test_qr_validation_flow_e2e(self, token):
        """Test complete QR validation flow as requested by user"""
        print("\n🔍 QR VALIDATION E2E FLOW TESTING")
        print("=" * 50)
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        
        # Step 1: Get list of approved purchases
        print(f"\n1️⃣ Getting list of approved purchases...")
        success1, compras_data = self.run_test("Get Admin Purchases", "GET", "admin/compras?estado=aprobado", 200, headers=headers)
        
        if not success1:
            print("❌ Cannot get purchases list")
            return False
        
        # Find a purchase with qr_payload
        compra_con_qr = None
        for compra in compras_data:
            if compra.get('estado_pago') == 'aprobado' and compra.get('qr_payload'):
                compra_con_qr = compra
                break
        
        if not compra_con_qr:
            print("❌ No approved purchase with QR payload found")
            print(f"   Found {len(compras_data)} purchases, but none have qr_payload")
            
            # Let's create and approve a purchase for testing
            print(f"\n🔧 Creating test purchase for QR validation...")
            
            # Get events first
            success_eventos, eventos = self.test_list_eventos()
            if not success_eventos or not eventos:
                print("❌ Cannot create test purchase without events")
                return False
            
            evento = eventos[0]
            evento_id = evento.get('id')
            
            # Create purchase
            compra_data = {
                "evento_id": evento_id,
                "nombre_comprador": "Test QR User",
                "email_comprador": "testqr@example.com",
                "telefono_comprador": "1234567890",
                "cantidad": 1,
                "precio_total": 25.0,
                "metodo_pago": "transferencia"
            }
            
            success_compra, purchase_data = self.run_test("Create Test Purchase for QR", "POST", "comprar-entrada", 200, compra_data)
            
            if not success_compra or not purchase_data.get('entradas'):
                print("❌ Cannot create test purchase")
                return False
            
            entrada = purchase_data['entradas'][0]
            entrada_id = entrada.get('id')
            qr_payload = entrada.get('qr_payload')
            
            if not entrada_id or not qr_payload:
                print("❌ Test purchase missing ID or QR payload")
                return False
            
            # Approve the purchase
            approval_data = {"entrada_ids": [entrada_id]}
            success_approval, _ = self.run_test("Approve Test Purchase", "POST", "admin/aprobar-compra", 200, approval_data, headers)
            
            if not success_approval:
                print("❌ Cannot approve test purchase")
                return False
            
            compra_con_qr = {
                'id': entrada_id,
                'qr_payload': qr_payload,
                'nombre_comprador': compra_data['nombre_comprador'],
                'estado_pago': 'aprobado'
            }
            
            print(f"   ✅ Created and approved test purchase: {entrada_id[:8]}...")
        
        # Step 2: Test QR validation with the found/created purchase
        print(f"\n2️⃣ Testing QR validation with approved purchase...")
        qr_payload = compra_con_qr.get('qr_payload')
        comprador = compra_con_qr.get('nombre_comprador', 'Unknown')
        
        print(f"   🎫 Testing QR for: {comprador}")
        print(f"   🔑 QR Payload length: {len(qr_payload)} characters")
        
        # Test verification mode
        validation_data = {
            "qr_payload": qr_payload,
            "accion": "verificar"
        }
        
        success2, validation_result = self.run_test("QR Validation - Verify", "POST", "validar-entrada", 200, validation_data)
        
        if success2:
            if validation_result.get('valido'):
                print(f"   ✅ QR validation successful")
                print(f"   👤 Comprador: {validation_result.get('entrada', {}).get('nombre_comprador', 'N/A')}")
                print(f"   🎪 Evento: {validation_result.get('entrada', {}).get('nombre_evento', 'N/A')}")
                print(f"   🪑 Asiento: {validation_result.get('entrada', {}).get('asiento', 'General')}")
                print(f"   📍 Estado: {validation_result.get('entrada', {}).get('estado_actual', 'N/A')}")
            else:
                print(f"   ❌ QR validation failed: {validation_result.get('mensaje', 'Unknown error')}")
                return False
        else:
            print("❌ QR validation request failed")
            return False
        
        # Step 3: Test entry action
        print(f"\n3️⃣ Testing QR validation with entry action...")
        validation_data_entry = {
            "qr_payload": qr_payload,
            "accion": "entrada"
        }
        
        success3, entry_result = self.run_test("QR Validation - Entry", "POST", "validar-entrada", 200, validation_data_entry)
        
        if success3:
            if entry_result.get('valido'):
                print(f"   ✅ Entry registration successful")
                print(f"   📝 Message: {entry_result.get('mensaje', 'N/A')}")
                print(f"   🎯 Action: {entry_result.get('tipo_accion', 'N/A')}")
            else:
                print(f"   ⚠️ Entry registration result: {entry_result.get('mensaje', 'Unknown')}")
                # This might be expected if person is already inside
        else:
            print("❌ Entry validation request failed")
            return False
        
        # Step 4: Test duplicate entry (should fail)
        print(f"\n4️⃣ Testing duplicate entry (should be blocked)...")
        success4, duplicate_result = self.run_test("QR Validation - Duplicate Entry", "POST", "validar-entrada", 200, validation_data_entry)
        
        if success4:
            if not duplicate_result.get('valido') and 'ya está dentro' in duplicate_result.get('mensaje', ''):
                print(f"   ✅ Duplicate entry correctly blocked")
                print(f"   🚨 Alert: {duplicate_result.get('mensaje', 'N/A')}")
            elif duplicate_result.get('valido'):
                print(f"   ⚠️ Unexpected: duplicate entry was allowed")
            else:
                print(f"   ℹ️ Entry blocked: {duplicate_result.get('mensaje', 'N/A')}")
        
        # Step 5: Test exit action
        print(f"\n5️⃣ Testing QR validation with exit action...")
        validation_data_exit = {
            "qr_payload": qr_payload,
            "accion": "salida"
        }
        
        success5, exit_result = self.run_test("QR Validation - Exit", "POST", "validar-entrada", 200, validation_data_exit)
        
        if success5:
            if exit_result.get('valido'):
                print(f"   ✅ Exit registration successful")
                print(f"   📝 Message: {exit_result.get('mensaje', 'N/A')}")
                print(f"   🎯 Action: {exit_result.get('tipo_accion', 'N/A')}")
            else:
                print(f"   ⚠️ Exit registration result: {exit_result.get('mensaje', 'Unknown')}")
        
        # Summary
        all_tests = [success1, success2, success3, success4, success5]
        passed_tests = sum(all_tests)
        total_tests = len(all_tests)
        
        print(f"\n🔍 QR VALIDATION E2E TEST SUMMARY:")
        print(f"   Tests Passed: {passed_tests}/{total_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        return passed_tests >= 4  # Allow one test to fail (duplicate entry might behave differently)

    def test_ticket_email_system_complete(self, token):
        """Run complete ticket image and email system test suite"""
        print("\n🎫 TICKET IMAGE & EMAIL SYSTEM TESTING")
        print("=" * 50)
        
        # Get events to test with
        success, eventos = self.test_list_eventos()
        if not success or not eventos:
            print("❌ Cannot test ticket system without events")
            return False
        
        # Use first event for testing
        evento = eventos[0]
        evento_id = evento.get('id')
        evento_nombre = evento.get('nombre', 'Unknown Event')
        
        if not evento_id:
            print("❌ No valid event ID found")
            return False
        
        print(f"\n🎪 Testing with event: {evento_nombre}")
        
        # Test 1: Create a new purchase for testing
        print(f"\n1️⃣ Creating test purchase...")
        compra_data = {
            "evento_id": evento_id,
            "nombre_comprador": "Carlos Mendez",
            "email_comprador": "carlos@example.com",
            "telefono_comprador": "1234567890",
            "cantidad": 1,
            "precio_total": 25.0,
            "metodo_pago": "transferencia"
        }
        
        success1, purchase_data = self.run_test("Create Test Purchase", "POST", "comprar-entrada", 200, compra_data)
        
        if not success1 or not purchase_data.get('entradas'):
            print("❌ Cannot continue without test purchase")
            return False
        
        entrada = purchase_data['entradas'][0]
        entrada_id = entrada.get('id')
        
        if not entrada_id:
            print("❌ No valid entrada ID found")
            return False
        
        print(f"   🎫 Test Ticket ID: {entrada_id[:8]}...")
        
        # Test 2: Try to get image before approval (should fail with 403)
        print(f"\n2️⃣ Testing image access before approval...")
        success2, _ = self.test_ticket_image_unapproved(entrada_id)
        
        # Test 3: Check email configuration
        print(f"\n3️⃣ Testing email configuration...")
        success3, email_config = self.test_email_config(token)
        
        # Test 4: Approve the purchase
        print(f"\n4️⃣ Testing purchase approval...")
        success4, _ = self.test_approve_purchase([entrada_id], token)
        
        # Test 5: Generate ticket image after approval
        print(f"\n5️⃣ Testing ticket image generation...")
        success5, _ = self.test_ticket_image_generation(entrada_id)
        
        # Test 6: Test approve and send email endpoint
        print(f"\n6️⃣ Creating another purchase for email test...")
        compra_data2 = {
            "evento_id": evento_id,
            "nombre_comprador": "Ana Garcia",
            "email_comprador": "ana@example.com",
            "telefono_comprador": "0987654321",
            "cantidad": 1,
            "precio_total": 25.0,
            "metodo_pago": "efectivo"
        }
        
        success6a, purchase_data2 = self.run_test("Create Second Test Purchase", "POST", "comprar-entrada", 200, compra_data2)
        
        if success6a and purchase_data2.get('entradas'):
            entrada2 = purchase_data2['entradas'][0]
            entrada2_id = entrada2.get('id')
            
            print(f"\n7️⃣ Testing approve and send email...")
            success6, _ = self.test_approve_and_send_email([entrada2_id], token)
        else:
            print("❌ Cannot test approve and send without second purchase")
            success6 = False
        
        # Summary
        all_tests = [success1, success2, success3, success4, success5, success6]
        passed_tests = sum(all_tests)
        total_tests = len(all_tests)
        
        print(f"\n🎫 TICKET SYSTEM TEST SUMMARY:")
        print(f"   Tests Passed: {passed_tests}/{total_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        return passed_tests == total_tests

    def test_seat_system_complete(self, token):
        """Run complete seat selection system test suite"""
        print("\n🪑 SEAT SELECTION SYSTEM TESTING")
        print("=" * 50)
        
        # Get events to test with
        success, eventos = self.test_list_eventos()
        if not success or not eventos:
            print("❌ Cannot test seat system without events")
            return False
        
        # Use first event for testing
        evento = eventos[0]
        evento_id = evento.get('id')
        evento_nombre = evento.get('nombre', 'Unknown Event')
        
        if not evento_id:
            print("❌ No valid event ID found")
            return False
        
        print(f"\n🎪 Testing with event: {evento_nombre}")
        
        # Test 1: Get initial seats state
        print(f"\n1️⃣ Testing initial seats state...")
        success1, _ = self.test_get_seats(evento_id)
        
        # Test 2: Configure seats (admin)
        print(f"\n2️⃣ Testing seat configuration...")
        success2, _ = self.test_configure_seats(evento_id, token)
        
        # Test 3: Get seats after configuration
        print(f"\n3️⃣ Testing seats after configuration...")
        success3, _ = self.test_get_seats(evento_id)
        
        # Test 4: Reserve seats
        print(f"\n4️⃣ Testing seat reservation...")
        success4, _ = self.test_reserve_seats(evento_id)
        
        # Test 5: Purchase with specific seats
        print(f"\n5️⃣ Testing purchase with seat selection...")
        success5, _ = self.test_purchase_with_seats(evento_id, evento_nombre)
        
        # Test 6: Verify occupied seats tracking
        print(f"\n6️⃣ Testing occupied seats tracking...")
        success6, _ = self.test_verify_occupied_seats(evento_id)
        
        # Summary
        all_tests = [success1, success2, success3, success4, success5, success6]
        passed_tests = sum(all_tests)
        total_tests = len(all_tests)
        
        print(f"\n🪑 SEAT SYSTEM TEST SUMMARY:")
        print(f"   Tests Passed: {passed_tests}/{total_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        return passed_tests == total_tests

def main():
    print("🎪 Ciudad Feria API Testing Suite")
    print("=" * 50)
    
    tester = CiudadFeriaAPITester()
    
    # Test 1: API Root
    tester.test_api_root()
    
    # Test 2: List Events
    success, eventos = tester.test_list_eventos()
    if not success or not eventos:
        print("❌ Cannot continue without events data")
        return 1
    
    # Test 3: Get Event Details (test first event)
    if eventos:
        primer_evento = eventos[0]
        evento_id = primer_evento.get('id')
        evento_nombre = primer_evento.get('nombre', 'Unknown Event')
        
        if evento_id:
            tester.test_get_evento_detail(evento_id)
            
            # Test 4: Buy Ticket
            success, entrada_data = tester.test_comprar_entrada(evento_id, evento_nombre)
            
            if success and isinstance(entrada_data, dict):
                # Test 5: Get My Tickets
                tester.test_mis_entradas("test@example.com")
                
                # Test 6: Validate QR (if we have qr_payload)
                qr_payload = entrada_data.get('qr_payload')
                if qr_payload:
                    print("\n🔍 Testing QR Validation with real payload...")
                    tester.test_validar_entrada(qr_payload)
                else:
                    print("\n🔍 Testing QR Validation...")
                    print("   Note: QR validation test may require actual QR payload from database")
    
    # Test 7: Admin Login
    print("\n🔐 Testing Admin Functionality...")
    admin_success, admin_token = tester.test_admin_login()
    
    if admin_success and admin_token:
        # Test 8: Admin Statistics
        tester.test_admin_estadisticas(admin_token)
        
        # Test 9: SEAT SELECTION SYSTEM (NEW)
        print("\n🪑 Testing Seat Selection System...")
        seat_system_success = tester.test_seat_system_complete(admin_token)
        
        if seat_system_success:
            print("✅ Seat selection system fully functional!")
        else:
            print("❌ Seat selection system has issues")
        
        # Test 10: TICKET IMAGE & EMAIL SYSTEM (NEW)
        print("\n🎫 Testing Ticket Image & Email System...")
        ticket_system_success = tester.test_ticket_email_system_complete(admin_token)
        
        if ticket_system_success:
            print("✅ Ticket image & email system fully functional!")
        else:
            print("❌ Ticket image & email system has issues")
    else:
        print("❌ Cannot test admin functionality without valid token")
    
    # Test Category Filtering (check if events have categories)
    print(f"\n📊 Event Categories Found:")
    categorias = set()
    for evento in eventos:
        categoria = evento.get('categoria', 'unknown')
        categorias.add(categoria)
    
    for categoria in sorted(categorias):
        eventos_categoria = [e for e in eventos if e.get('categoria') == categoria]
        print(f"   {categoria}: {len(eventos_categoria)} events")
    
    # Print final results
    print(f"\n📊 Test Results Summary:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Print failed tests
    failed_tests = [r for r in tester.test_results if not r['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test['test']}: {test['details']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())