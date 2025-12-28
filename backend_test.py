import requests
import sys
import json
from datetime import datetime

class CiudadFeriaAPITester:
    def __init__(self, base_url="https://feriasansebastian.preview.emergentagent.com"):
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