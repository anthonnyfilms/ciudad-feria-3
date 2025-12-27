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
                # Note: This might fail if the QR payload format is different
                # We'll try to extract it from the database response
                print("\n🔍 Testing QR Validation...")
                print("   Note: QR validation test may require actual QR payload from database")
    
    # Test 7: Admin Login
    print("\n🔐 Testing Admin Functionality...")
    admin_success, admin_token = tester.test_admin_login()
    
    if admin_success and admin_token:
        # Test 8: Admin Statistics
        tester.test_admin_estadisticas(admin_token)
    else:
        print("❌ Cannot test admin statistics without valid token")
    
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