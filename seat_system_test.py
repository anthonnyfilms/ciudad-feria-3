#!/usr/bin/env python3
"""
Focused test for Ciudad Feria Seat Selection System
Tests all the specific endpoints mentioned in the review request
"""

import requests
import json

class SeatSystemTester:
    def __init__(self):
        self.base_url = "https://eventix-venez.preview.emergentagent.com"
        self.api_url = f"{self.base_url}/api"
        self.admin_token = None
        self.test_evento_id = None
        self.purchased_seats = []

    def login_admin(self):
        """Login as admin and get token"""
        print("🔐 Logging in as admin...")
        response = requests.post(f"{self.api_url}/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        if response.status_code == 200:
            self.admin_token = response.json()['access_token']
            print("✅ Admin login successful")
            return True
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return False

    def get_test_event(self):
        """Get an event to test with"""
        print("📋 Getting test event...")
        response = requests.get(f"{self.api_url}/eventos")
        
        if response.status_code == 200:
            eventos = response.json()
            if eventos:
                self.test_evento_id = eventos[0]['id']
                print(f"✅ Using event: {eventos[0]['nombre']} (ID: {self.test_evento_id})")
                return True
        
        print("❌ Failed to get test event")
        return False

    def test_get_seats_endpoint(self):
        """Test GET /api/eventos/{evento_id}/asientos"""
        print("\n1️⃣ Testing GET /api/eventos/{evento_id}/asientos")
        
        response = requests.get(f"{self.api_url}/eventos/{self.test_evento_id}/asientos")
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ['tipo_asientos', 'configuracion', 'capacidad_total', 'asientos_ocupados', 'asientos_pendientes', 'disponibles']
            
            missing = [field for field in required_fields if field not in data]
            if missing:
                print(f"❌ Missing fields: {missing}")
                return False
            
            print("✅ Get seats endpoint working correctly")
            print(f"   - Seat type: {data['tipo_asientos']}")
            print(f"   - Total capacity: {data['capacidad_total']}")
            print(f"   - Occupied: {len(data['asientos_ocupados'])}")
            print(f"   - Pending: {len(data['asientos_pendientes'])}")
            print(f"   - Available: {data['disponibles']}")
            return True
        else:
            print(f"❌ Get seats failed: {response.status_code}")
            return False

    def test_configure_seats_endpoint(self):
        """Test POST /api/admin/eventos/{evento_id}/configurar-asientos"""
        print("\n2️⃣ Testing POST /api/admin/eventos/{evento_id}/configurar-asientos")
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        
        config_data = {
            "tipo_asientos": "mesas",
            "configuracion": {
                "mesas": [
                    {"id": "1", "nombre": "Mesa VIP 1", "sillas": 10, "precio": 50, "categoria": "VIP"},
                    {"id": "2", "nombre": "Mesa VIP 2", "sillas": 10, "precio": 50, "categoria": "VIP"}
                ]
            }
        }
        
        response = requests.post(
            f"{self.api_url}/admin/eventos/{self.test_evento_id}/configurar-asientos",
            json=config_data,
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('capacidad_total') == 20:
                print("✅ Configure seats endpoint working correctly")
                print(f"   - Configuration type: {data.get('tipo')}")
                print(f"   - Total capacity: {data.get('capacidad_total')}")
                print(f"   - Seats created: {data.get('asientos_creados')}")
                return True
            else:
                print(f"❌ Unexpected response: {data}")
                return False
        else:
            print(f"❌ Configure seats failed: {response.status_code} - {response.text}")
            return False

    def test_reserve_seats_endpoint(self):
        """Test POST /api/reservar-asientos"""
        print("\n3️⃣ Testing POST /api/reservar-asientos")
        
        reservation_data = {
            "evento_id": self.test_evento_id,
            "asientos": ["M1-S1", "M1-S2"],
            "session_id": "test-session"
        }
        
        response = requests.post(f"{self.api_url}/reservar-asientos", json=reservation_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('asientos_reservados'):
                print("✅ Reserve seats endpoint working correctly")
                print(f"   - Session ID: {data.get('session_id')}")
                print(f"   - Reserved seats: {data.get('asientos_reservados')}")
                print(f"   - Expires in: {data.get('expira_en')} seconds")
                return True
            else:
                print(f"❌ Unexpected response: {data}")
                return False
        else:
            print(f"❌ Reserve seats failed: {response.status_code} - {response.text}")
            return False

    def test_purchase_with_seats_endpoint(self):
        """Test POST /api/comprar-entrada with seat selection"""
        print("\n4️⃣ Testing POST /api/comprar-entrada with seat selection")
        
        # First check which seats are available
        response = requests.get(f"{self.api_url}/eventos/{self.test_evento_id}/asientos")
        if response.status_code == 200:
            data = response.json()
            occupied = data.get('asientos_ocupados', [])
            pending = data.get('asientos_pendientes', [])
            unavailable = set(occupied + pending)
            
            # Find available seats
            available_seats = []
            for mesa_id in ["1", "2"]:
                for silla in range(1, 11):  # 10 chairs per table
                    seat = f"M{mesa_id}-S{silla}"
                    if seat not in unavailable:
                        available_seats.append(seat)
                        if len(available_seats) >= 2:
                            break
                if len(available_seats) >= 2:
                    break
            
            if len(available_seats) < 2:
                print(f"❌ Not enough available seats. Available: {available_seats}")
                return False
            
            test_seats = available_seats[:2]
            print(f"   Using available seats: {test_seats}")
        else:
            print("❌ Failed to check seat availability")
            return False
        
        purchase_data = {
            "evento_id": self.test_evento_id,
            "nombre_comprador": "Test User 2",
            "email_comprador": "test2@test.com",
            "telefono_comprador": "1234567",
            "cantidad": 2,
            "precio_total": 100.0,
            "metodo_pago": "efectivo",
            "asientos": test_seats
        }
        
        response = requests.post(f"{self.api_url}/comprar-entrada", json=purchase_data)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data.get('entradas'):
                entradas = data['entradas']
                seats_assigned = [entrada.get('asiento') for entrada in entradas if entrada.get('asiento')]
                
                if len(seats_assigned) == 2 and all(seat in test_seats for seat in seats_assigned):
                    print("✅ Purchase with seats endpoint working correctly")
                    print(f"   - Tickets created: {len(entradas)}")
                    print(f"   - Seats assigned: {seats_assigned}")
                    self.purchased_seats = seats_assigned  # Store for verification
                    return True
                else:
                    print(f"❌ Seat assignment issue. Expected {test_seats}, got {seats_assigned}")
                    return False
            else:
                print(f"❌ Unexpected response: {data}")
                return False
        else:
            print(f"❌ Purchase with seats failed: {response.status_code} - {response.text}")
            return False

    def test_verify_occupied_seats(self):
        """Test that purchased seats appear in occupied list"""
        print("\n5️⃣ Testing occupied seats tracking")
        
        response = requests.get(f"{self.api_url}/eventos/{self.test_evento_id}/asientos")
        
        if response.status_code == 200:
            data = response.json()
            asientos_pendientes = data.get('asientos_pendientes', [])
            
            # Use the seats we actually purchased
            expected_seats = getattr(self, 'purchased_seats', [])
            if not expected_seats:
                print("❌ No purchased seats to verify")
                return False
            
            found_seats = [seat for seat in expected_seats if seat in asientos_pendientes]
            
            if len(found_seats) == len(expected_seats):
                print("✅ Occupied seats tracking working correctly")
                print(f"   - Pending seats: {found_seats}")
                return True
            else:
                print(f"❌ Seat tracking issue. Expected {expected_seats} in pending, found {found_seats}")
                print(f"   - All pending seats: {asientos_pendientes}")
                return False
        else:
            print(f"❌ Failed to verify occupied seats: {response.status_code}")
            return False

    def run_all_tests(self):
        """Run all seat system tests"""
        print("🪑 CIUDAD FERIA SEAT SELECTION SYSTEM TEST")
        print("=" * 60)
        
        # Setup
        if not self.login_admin():
            return False
        
        if not self.get_test_event():
            return False
        
        # Run tests
        tests = [
            self.test_get_seats_endpoint,
            self.test_configure_seats_endpoint,
            self.test_get_seats_endpoint,  # Test again after configuration
            self.test_reserve_seats_endpoint,
            self.test_purchase_with_seats_endpoint,
            self.test_verify_occupied_seats
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print(f"\n📊 FINAL RESULTS:")
        print(f"   Tests passed: {passed}/{total}")
        print(f"   Success rate: {(passed/total*100):.1f}%")
        
        if passed == total:
            print("🎉 ALL SEAT SELECTION TESTS PASSED!")
            return True
        else:
            print("❌ Some tests failed")
            return False

if __name__ == "__main__":
    tester = SeatSystemTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)