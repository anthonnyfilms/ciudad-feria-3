"""
Test suite for Thermal Tickets (Tickets Térmicos) feature
Tests the POST /api/admin/generar-entradas-termicas and GET /api/admin/entrada-termica/{id} endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestThermalTickets:
    """Tests for thermal ticket generation and retrieval"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token and event ID"""
        # Login to get token
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get events to find test event
        events_response = requests.get(f"{BASE_URL}/api/eventos")
        assert events_response.status_code == 200, f"Failed to get events: {events_response.text}"
        events = events_response.json()
        
        # Use FESTIVAL DEL HUMOR event or first available
        self.evento_id = None
        self.evento_nombre = None
        for event in events:
            if "FESTIVAL DEL HUMOR" in event.get('nombre', '').upper():
                self.evento_id = event['id']
                self.evento_nombre = event['nombre']
                break
        
        if not self.evento_id and events:
            self.evento_id = events[0]['id']
            self.evento_nombre = events[0]['nombre']
        
        yield
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        print("✅ Admin login successful")
    
    def test_get_eventos(self):
        """Test getting events list"""
        response = requests.get(f"{BASE_URL}/api/eventos")
        assert response.status_code == 200
        events = response.json()
        assert isinstance(events, list)
        print(f"✅ Got {len(events)} events")
    
    def test_generar_entradas_termicas_single(self):
        """Test generating a single thermal ticket"""
        if not self.evento_id:
            pytest.skip("No events available for testing")
        
        payload = {
            "evento_id": self.evento_id,
            "categoria": "General",
            "cantidad": 1,
            "precio": 10.00
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/generar-entradas-termicas",
            json=payload,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to generate ticket: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True
        assert data.get("cantidad") == 1
        assert "entradas" in data
        assert len(data["entradas"]) == 1
        
        # Verify ticket data
        entrada = data["entradas"][0]
        assert "id" in entrada
        assert "codigo_alfanumerico" in entrada
        assert entrada["evento_id"] == self.evento_id
        assert entrada["categoria_entrada"] == "General"
        assert entrada["precio_total"] == 10.00
        assert entrada["estado_pago"] == "aprobado"
        assert entrada["tipo_venta"] == "taquilla"
        assert "codigo_qr" in entrada
        
        # Store for next test
        self.generated_ticket_id = entrada["id"]
        self.generated_ticket_code = entrada["codigo_alfanumerico"]
        
        print(f"✅ Generated single thermal ticket: {self.generated_ticket_code}")
        return entrada
    
    def test_generar_entradas_termicas_batch(self):
        """Test generating multiple thermal tickets (batch)"""
        if not self.evento_id:
            pytest.skip("No events available for testing")
        
        payload = {
            "evento_id": self.evento_id,
            "categoria": "VIP",
            "cantidad": 5,
            "precio": 25.00
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/generar-entradas-termicas",
            json=payload,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Failed to generate batch: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("cantidad") == 5
        assert len(data["entradas"]) == 5
        
        # Verify all tickets have unique codes
        codes = [e["codigo_alfanumerico"] for e in data["entradas"]]
        assert len(codes) == len(set(codes)), "Duplicate codes found!"
        
        # Verify all tickets have correct data
        for entrada in data["entradas"]:
            assert entrada["categoria_entrada"] == "VIP"
            assert entrada["precio_total"] == 25.00
            assert entrada["estado_pago"] == "aprobado"
        
        print(f"✅ Generated batch of 5 VIP thermal tickets")
        return data["entradas"]
    
    def test_obtener_entrada_termica_imagen(self):
        """Test getting thermal ticket image (PNG)"""
        if not self.evento_id:
            pytest.skip("No events available for testing")
        
        # First generate a ticket
        payload = {
            "evento_id": self.evento_id,
            "categoria": "Test",
            "cantidad": 1,
            "precio": 15.00
        }
        
        gen_response = requests.post(
            f"{BASE_URL}/api/admin/generar-entradas-termicas",
            json=payload,
            headers=self.headers
        )
        assert gen_response.status_code == 200
        ticket_id = gen_response.json()["entradas"][0]["id"]
        
        # Get the ticket image
        img_response = requests.get(
            f"{BASE_URL}/api/admin/entrada-termica/{ticket_id}",
            headers=self.headers
        )
        
        assert img_response.status_code == 200, f"Failed to get ticket image: {img_response.text}"
        assert img_response.headers.get("content-type") == "image/png"
        
        # Verify image size (should be 576x400 for thermal printer)
        from PIL import Image
        from io import BytesIO
        
        img = Image.open(BytesIO(img_response.content))
        width, height = img.size
        
        assert width == 576, f"Expected width 576, got {width}"
        assert height == 400, f"Expected height 400, got {height}"
        
        print(f"✅ Thermal ticket image retrieved: {width}x{height}px")
    
    def test_entrada_termica_not_found(self):
        """Test getting non-existent ticket returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/admin/entrada-termica/non-existent-id",
            headers=self.headers
        )
        assert response.status_code == 404
        print("✅ Non-existent ticket returns 404")
    
    def test_generar_entradas_evento_not_found(self):
        """Test generating tickets for non-existent event returns 404"""
        payload = {
            "evento_id": "non-existent-event-id",
            "categoria": "General",
            "cantidad": 1,
            "precio": 10.00
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/generar-entradas-termicas",
            json=payload,
            headers=self.headers
        )
        
        assert response.status_code == 404
        print("✅ Non-existent event returns 404")
    
    def test_generar_entradas_unauthorized(self):
        """Test generating tickets without auth returns 401/403"""
        payload = {
            "evento_id": self.evento_id or "test",
            "categoria": "General",
            "cantidad": 1,
            "precio": 10.00
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/generar-entradas-termicas",
            json=payload
            # No auth headers
        )
        
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ Unauthorized request properly rejected")
    
    def test_ticket_contains_qr_code(self):
        """Test that generated ticket contains QR code data"""
        if not self.evento_id:
            pytest.skip("No events available for testing")
        
        payload = {
            "evento_id": self.evento_id,
            "categoria": "QRTest",
            "cantidad": 1,
            "precio": 5.00
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/generar-entradas-termicas",
            json=payload,
            headers=self.headers
        )
        
        assert response.status_code == 200
        entrada = response.json()["entradas"][0]
        
        # Verify QR code is present
        assert "codigo_qr" in entrada
        assert entrada["codigo_qr"].startswith("data:image/png;base64,")
        
        # Verify QR payload is present
        assert "qr_payload" in entrada
        assert len(entrada["qr_payload"]) > 0
        
        # Verify hash validation is present
        assert "hash_validacion" in entrada
        assert len(entrada["hash_validacion"]) > 0
        
        print("✅ Ticket contains QR code, payload, and hash validation")
    
    def test_codigo_alfanumerico_format(self):
        """Test that codigo_alfanumerico follows expected format"""
        if not self.evento_id:
            pytest.skip("No events available for testing")
        
        payload = {
            "evento_id": self.evento_id,
            "categoria": "Premium",
            "cantidad": 1,
            "precio": 50.00
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/generar-entradas-termicas",
            json=payload,
            headers=self.headers
        )
        
        assert response.status_code == 200
        codigo = response.json()["entradas"][0]["codigo_alfanumerico"]
        
        # Format should be CF-{CAT}-{UNIQUE}
        assert codigo.startswith("CF-"), f"Code should start with CF-, got {codigo}"
        parts = codigo.split("-")
        assert len(parts) >= 3, f"Code should have at least 3 parts, got {codigo}"
        
        print(f"✅ Codigo alfanumerico format correct: {codigo}")


class TestThermalTicketsValidation:
    """Tests for thermal ticket validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert login_response.status_code == 200
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get first event
        events_response = requests.get(f"{BASE_URL}/api/eventos")
        events = events_response.json()
        self.evento_id = events[0]['id'] if events else None
        
        yield
    
    def test_validate_thermal_ticket_by_code(self):
        """Test validating a thermal ticket by its alphanumeric code"""
        if not self.evento_id:
            pytest.skip("No events available")
        
        # Generate a ticket
        gen_response = requests.post(
            f"{BASE_URL}/api/admin/generar-entradas-termicas",
            json={
                "evento_id": self.evento_id,
                "categoria": "ValidTest",
                "cantidad": 1,
                "precio": 10.00
            },
            headers=self.headers
        )
        assert gen_response.status_code == 200
        codigo = gen_response.json()["entradas"][0]["codigo_alfanumerico"]
        
        # Validate by code
        validate_response = requests.post(
            f"{BASE_URL}/api/validar-entrada-codigo",
            json={
                "codigo": codigo,
                "accion": "verificar"
            }
        )
        
        assert validate_response.status_code == 200
        data = validate_response.json()
        assert data.get("valido") == True
        
        print(f"✅ Thermal ticket validated by code: {codigo}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
